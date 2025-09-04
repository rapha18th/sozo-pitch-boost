# -----------------------------------------------------------------------------
# 1. IMPORTS & INITIALIZATION
# -----------------------------------------------------------------------------
import os
import io
import uuid
import json
import traceback
import math
import logging
from datetime import datetime

import requests
import fitz  # PyMuPDF
from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db, auth
from google import genai

# --- Basic Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Initialize Flask App & CORS ---
app = Flask(__name__)
CORS(app)

# --- Firebase Initialization ---
try:
    credentials_json_string = os.environ.get("FIREBASE")
    if not credentials_json_string: raise ValueError("The 'FIREBASE' environment variable is not set.")
    credentials_json = json.loads(credentials_json_string)
    firebase_db_url = os.environ.get("Firebase_DB")
    if not firebase_db_url: raise ValueError("The 'Firebase_DB' environment variable must be set.")
    cred = credentials.Certificate(credentials_json)
    firebase_admin.initialize_app(cred, {'databaseURL': firebase_db_url})
    db_ref = db.reference()
    logger.info("Firebase Admin SDK initialized successfully.")
except Exception as e:
    logger.critical(f"FATAL: Error initializing Firebase: {e}")
    exit(1)

# --- AI Client Initialization ---
try:
    gemini_api_key = os.environ.get("Gemini")
    if not gemini_api_key: raise ValueError("The 'Gemini' environment variable for the API key is not set.")
    client = genai.Client(api_key=gemini_api_key)
    MODEL_NAME = 'gemini-2.0-flash' 
    logger.info(f"Google GenAI Client initialized successfully for model {MODEL_NAME}.")
    ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY")
    if not ELEVENLABS_API_KEY: raise ValueError("The 'ELEVENLABS_API_KEY' environment variable is not set.")
    logger.info("ElevenLabs API Key loaded.")
except Exception as e:
    logger.critical(f"FATAL: Error initializing AI Clients: {e}")
    logger.critical(traceback.format_exc())
    exit(1)


# -----------------------------------------------------------------------------
# 2. CORE HELPER FUNCTIONS
# -----------------------------------------------------------------------------
def verify_token(auth_header):
    if not auth_header or not auth_header.startswith('Bearer '): return None
    token = auth_header.split('Bearer ')[1]
    try:
        return auth.verify_id_token(token)['uid']
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        return None

def verify_admin(auth_header):
    uid = verify_token(auth_header)
    if not uid: raise PermissionError('Invalid or missing user token')
    user_data = db_ref.child(f'users/{uid}').get()
    if not user_data or not user_data.get('is_admin', False):
        raise PermissionError('Admin access required')
    return uid

def extract_text_from_input(file, text):
    if file:
        if file.mimetype == 'application/pdf':
            try:
                pdf_document = fitz.open(stream=file.read(), filetype="pdf")
                full_text = "".join(page.get_text() for page in pdf_document)
                pdf_document.close()
                return full_text
            except Exception as e:
                logger.error(f"Error processing PDF file: {e}")
                raise ValueError("Could not read the provided PDF file.")
        else:
            raise ValueError("Unsupported file type. Please upload a PDF.")
    elif text:
        return text
    else:
        raise ValueError("No input provided. Please supply either a file or text.")


# -----------------------------------------------------------------------------
# 3. AI LOGIC FUNCTIONS
# -----------------------------------------------------------------------------

def summarize_and_extract_context_with_gemini(text):
    logger.info("Starting intelligent context extraction with Gemini.")
    prompt = f"""
    You are an expert document analyst. Analyze the following document text and perform two tasks:
    1.  Generate a concise, one-sentence "short_description" of the document's overall purpose.
    2.  Extract the "key_points" that are most critical for a mock interview or pitch scenario. This should be a dense paragraph or a few bullet points.

    Your entire response MUST be a single, valid JSON object with the keys "short_description" and "key_points". Do not include any text before or after the JSON.

    Document Text:
    "{text}"
    """
    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        json_text = response.text.strip().lstrip("```json").rstrip("```")
        data = json.loads(json_text)
        logger.info("Successfully extracted intelligent context.")
        return data
    except Exception as e:
        logger.error(f"Error during intelligent context extraction: {e}")
        return {
            "short_description": "User-provided project document.",
            "key_points": text[:1000]
        }

def detect_use_case_with_gemini(text):
    logger.info("Starting use case detection with Gemini.")
    prompt = f"""
    Analyze the following text. Your task is to classify it into one of three categories: 'Job Interview', 'Investor Pitch', or 'Academic Presentation'. 
    Respond with ONLY the category name and nothing else.

    Text: "{text[:4000]}"
    """
    try:
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        category = response.text.strip().replace("'", "").replace('"', '')
        valid_categories = ['Job Interview', 'Investor Pitch', 'Academic Presentation']
        if category in valid_categories:
            logger.info(f"Gemini detected use case: {category}")
            return category
        else:
            logger.warning(f"Gemini returned an invalid category: '{category}'. Defaulting to 'Job Interview'.")
            return 'Job Interview'
    except Exception as e:
        logger.error(f"Error during Gemini use case detection: {e}")
        raise

def _get_context_specific_instructions(use_case):
    if use_case == 'Job Interview':
        return "Pay close attention to the user's ability to align their skills with the role requirements mentioned in the briefing. Note any use of the STAR (Situation, Task, Action, Result) method in their answers."
    elif use_case == 'Investor Pitch':
        return "Focus on the strength of the storytelling, the clarity of the business model, market logic, and how well they defended financial assumptions when challenged."
    elif use_case == 'Academic Presentation':
        return "Critique the methodological rigor, the clarity of the research findings, and the user's composure when handling critiques or questions about their research's validity."
    else:
        return ""

def analyze_transcript_with_gemini(uid, project_id, transcript, duration_seconds):
    logger.info(f"Starting transcript analysis for project {project_id}.")
    try:
        project_ref = db_ref.child(f'projects/{uid}/{project_id}')
        project_data = project_ref.get()
        if not project_data: raise ValueError("Project not found for analysis.")
        use_case = project_data.get('detectedUseCase', 'General')
        context_text = project_data.get('key_points', project_data.get('originalBriefingText', ''))
        prompt = f"""
        You are an expert performance coach. The user was practicing for a mock '{use_case}'.
        Their session was based on a document with these key points: "{context_text}"
        
        Your task is to analyze the following transcript. Your analysis must be a valid JSON object.
        Evaluate on: Communication Skills, Content Mastery, Engagement & Delivery, and Resilience Under Pressure.
        
        Provide: A score (0-100) for each, "qualitativeStrengths", "qualitativeImprovements", and "contextSpecificFeedback".
        
        The JSON structure MUST be:
        {{
          "communicationScore": <integer>, "contentMasteryScore": <integer>, "engagementDeliveryScore": <integer>,
          "resilienceScore": <integer>, "qualitativeStrengths": "<string>", "qualitativeImprovements": "<string>",
          "contextSpecificFeedback": "<string>"
        }}
        
        Transcript: "{transcript}"
        """
        response = client.models.generate_content(model=MODEL_NAME, contents=prompt)
        feedback_json_text = response.text.strip().lstrip("```json").rstrip("```")
        feedback_data = json.loads(feedback_json_text)
        session_id = str(uuid.uuid4())
        session_ref = project_ref.child(f'practiceSessions/{session_id}')
        session_data = {
            "sessionId": session_id, "createdAt": datetime.utcnow().isoformat() + "Z",
            "durationSeconds": duration_seconds, "transcript": transcript, "feedback": feedback_data
        }
        session_ref.set(session_data)
        logger.info(f"Successfully saved feedback for session {session_id}.")
        user_ref = db_ref.child(f'users/{uid}')
        user_data = user_ref.get()
        current_credits = user_data.get('credits', 0)
        cost = math.ceil(duration_seconds / 60) * 3
        new_credits = max(0, current_credits - cost)
        user_ref.update({'credits': new_credits})
        logger.info(f"Credits deducted for user {uid}. Cost: {cost}, Remaining: {new_credits}")
        return {"cost": cost, "remaining": new_credits, "sessionId": session_id}
    except Exception as e:
        logger.error(f"An error occurred during transcript analysis for project {project_id}: {e}")
        logger.error(traceback.format_exc())
        db_ref.child(f'projects/{uid}/{project_id}/sessions').push().set({"error": str(e), "transcript": transcript})
        raise

def generate_agent_briefing(uid, project_id):
    logger.info(f"Generating agent briefing for project {project_id}.")
    project_ref = db_ref.child(f'projects/{uid}/{project_id}')
    project_data = project_ref.get()
    if not project_data: raise ValueError("Project not found.")
    use_case = project_data.get('detectedUseCase', 'General')
    key_points = project_data.get('key_points', 'No specific context was extracted.')
    base_briefing = f"This is a mock '{use_case}'. The user's context is based on a document with these key points: '{key_points}'. Your goal is to act as a realistic {use_case.split(' ')[0]} interviewer/panelist and ask relevant questions."
    sessions = project_data.get('practiceSessions', {})
    if not sessions: return f"{base_briefing} This is the user's first practice session for this project. Start with some introductory questions."
    try:
        past_feedback_summary = []
        for session in sessions.values():
            feedback = session.get('feedback', {})
            if feedback:
                past_feedback_summary.append({
                    "improvements": feedback.get('qualitativeImprovements'),
                    "scores": {"communication": feedback.get('communicationScore'), "content": feedback.get('contentMasteryScore'), "resilience": feedback.get('resilienceScore')}
                })
        if not past_feedback_summary: return f"{base_briefing} The user has practiced before, but their feedback is unavailable. Conduct a standard session."
        summary_prompt = f"""
        You are an assistant preparing a briefing for a conversational AI agent. Analyze the user's past performance feedback and provide a short, 1-2 sentence directive for the agent. Focus on the most consistent area of weakness.
        Past Feedback: {json.dumps(past_feedback_summary)}
        Example directives:
        - "The user consistently scores low on Resilience. Challenge their financial assumptions more aggressively this time."
        - "The user struggles with concise communication. Ask multi-part questions to test their ability to stay on track."
        Your directive for the agent:
        """
        response = client.models.generate_content(model=MODEL_NAME, contents=summary_prompt)
        dynamic_directive = response.text.strip()
        logger.info(f"Generated dynamic directive for agent: {dynamic_directive}")
        return f"{base_briefing} {dynamic_directive}"
    except Exception as e:
        logger.error(f"Could not generate dynamic briefing for project {project_id}: {e}")
        return base_briefing


# -----------------------------------------------------------------------------
# 4. USER & AUTHENTICATION ENDPOINTS
# -----------------------------------------------------------------------------
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.get_json()
        email, password, display_name = data.get('email'), data.get('password'), data.get('displayName')
        if not email or not password: return jsonify({'error': 'Email and password are required'}), 400
        user = auth.create_user(email=email, password=password, display_name=display_name)
        user_ref = db_ref.child(f'users/{user.uid}')
        user_data = {
            'email': email, 'displayName': display_name, 'credits': 30, 'is_admin': False,
            'createdAt': datetime.utcnow().isoformat() + "Z"
        }
        user_ref.set(user_data)
        logger.info(f"New user signed up: {user.uid}, Name: {display_name}")
        return jsonify({'success': True, 'uid': user.uid, **user_data}), 201
    except Exception as e:
        logger.error(f"Signup failed: {e}")
        if 'EMAIL_EXISTS' in str(e): return jsonify({'error': 'An account with this email already exists.'}), 409
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/social-signin', methods=['POST'])
def social_signin():
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Invalid or expired token'}), 401
    user_ref, user_data = db_ref.child(f'users/{uid}'), db_ref.child(f'users/{uid}').get()
    if user_data:
        logger.info(f"Existing social user signed in: {uid}")
        return jsonify({'uid': uid, **user_data}), 200
    else:
        logger.info(f"New social user detected: {uid}. Creating database profile.")
        try:
            firebase_user = auth.get_user(uid)
            new_user_data = {
                'email': firebase_user.email, 'displayName': firebase_user.display_name, 'credits': 30,
                'is_admin': False, 'createdAt': datetime.utcnow().isoformat() + "Z"
            }
            user_ref.set(new_user_data)
            logger.info(f"Successfully created profile for new social user: {uid}")
            return jsonify({'success': True, 'uid': uid, **new_user_data}), 201
        except Exception as e:
            logger.error(f"Error creating profile for new social user {uid}: {e}")
            return jsonify({'error': f'Failed to create user profile: {str(e)}'}), 500

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Invalid or expired token'}), 401
    user_data = db_ref.child(f'users/{uid}').get()
    if not user_data: return jsonify({'error': 'User not found'}), 404
    return jsonify({'uid': uid, **user_data})

# -----------------------------------------------------------------------------
# 5. CORE APPLICATION ENDPOINTS (FULL CRUD & CREDIT CHECKS)
# -----------------------------------------------------------------------------

@app.route('/api/projects', methods=['POST'])
def create_project():
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    user_ref = db_ref.child(f'users/{uid}')
    user_data = user_ref.get()
    if not user_data or user_data.get('credits', 0) < 1:
        return jsonify({'error': 'Insufficient credits to create a project.'}), 402
    try:
        briefing_text = extract_text_from_input(request.files.get('file'), request.form.get('text'))
        context_data = summarize_and_extract_context_with_gemini(briefing_text)
        detected_use_case = detect_use_case_with_gemini(briefing_text)
        project_id = str(uuid.uuid4())
        project_ref = db_ref.child(f'projects/{uid}/{project_id}')
        project_data = {
            "projectId": project_id, "userId": uid,
            "title": context_data.get('short_description', 'New Project'),
            "detectedUseCase": detected_use_case,
            "originalBriefingText": briefing_text,
            "key_points": context_data.get('key_points'),
            "short_description": context_data.get('short_description'),
            "createdAt": datetime.utcnow().isoformat() + "Z", "practiceSessions": {}
        }
        project_ref.set(project_data)
        user_ref.update({'credits': user_data.get('credits', 0) - 1})
        logger.info(f"Created new project {project_id} for user {uid}. Cost: 1 credit.")
        return jsonify(project_data), 201
    except ValueError as e: return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Project creation failed for user {uid}: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

@app.route('/api/projects', methods=['GET'])
def list_projects():
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    try:
        projects_data = db_ref.child(f'projects/{uid}').get()
        return jsonify(list(projects_data.values()) if projects_data else []), 200
    except Exception as e:
        logger.error(f"Failed to list projects for user {uid}: {e}")
        return jsonify({'error': 'Could not retrieve projects.'}), 500

@app.route('/api/projects/<string:project_id>', methods=['GET'])
def get_project(project_id):
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    try:
        project_data = db_ref.child(f'projects/{uid}/{project_id}').get()
        if not project_data: return jsonify({'error': 'Project not found or access denied'}), 404
        return jsonify(project_data), 200
    except Exception as e:
        logger.error(f"Failed to get project {project_id} for user {uid}: {e}")
        return jsonify({'error': 'Could not retrieve project details.'}), 500

@app.route('/api/projects/<string:project_id>', methods=['PUT'])
def update_project(project_id):
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    new_title = data.get('title')
    if not new_title or not isinstance(new_title, str) or len(new_title.strip()) == 0:
        return jsonify({'error': 'A valid title is required.'}), 400
    try:
        project_ref = db_ref.child(f'projects/{uid}/{project_id}')
        if not project_ref.get(): return jsonify({'error': 'Project not found or access denied'}), 404
        project_ref.update({'title': new_title.strip()})
        logger.info(f"User {uid} updated title for project {project_id}.")
        return jsonify({'success': True, 'message': 'Project updated successfully.'}), 200
    except Exception as e:
        logger.error(f"Failed to update project {project_id} for user {uid}: {e}")
        return jsonify({'error': 'Could not update the project.'}), 500

@app.route('/api/projects/<string:project_id>', methods=['DELETE'])
def delete_project(project_id):
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    try:
        project_ref = db_ref.child(f'projects/{uid}/{project_id}')
        if not project_ref.get(): return jsonify({'error': 'Project not found or access denied'}), 404
        project_ref.delete()
        logger.info(f"User {uid} deleted project {project_id}.")
        return jsonify({'success': True, 'message': 'Project deleted successfully.'}), 200
    except Exception as e:
        logger.error(f"Failed to delete project {project_id} for user {uid}: {e}")
        return jsonify({'error': 'Could not delete the project.'}), 500

@app.route('/api/projects/<string:project_id>/briefing', methods=['GET'])
def get_agent_briefing(project_id):
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    try:
        briefing = generate_agent_briefing(uid, project_id)
        return jsonify({"briefing": briefing})
    except ValueError as e: return jsonify({'error': str(e)}), 404
    except Exception as e:
        logger.error(f"Failed to generate briefing for project {project_id}: {e}")
        return jsonify({'error': 'Could not generate session briefing.'}), 500

@app.route('/api/ai/get-agent-url', methods=['GET'])
def get_agent_url():
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    user_data = db_ref.child(f'users/{uid}').get()
    if not user_data or user_data.get('credits', 0) < 3:
        return jsonify({'error': 'Insufficient credits to start a call. Minimum 3 required.'}), 402
    try:
        agent_id = os.environ.get("ELEVENLABS_AGENT_ID")
        if not agent_id: raise ValueError("ELEVENLABS_AGENT_ID is not configured on the server.")
        url, headers = f"https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={agent_id}", {"xi-api-key": ELEVENLABS_API_KEY}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        logger.info(f"Successfully generated ElevenLabs signed URL for user {uid}.")
        return jsonify(response.json()), 200
    except requests.exceptions.RequestException as e:
        logger.error(f"ElevenLabs API error for user {uid}: {e}")
        return jsonify({'error': 'Failed to connect to the conversation service.'}), 502
    except Exception as e:
        logger.error(f"Error in get_agent_url for user {uid}: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

@app.route('/api/projects/<string:project_id>/sessions/end', methods=['POST'])
def end_session_and_analyze(project_id): # <-- CORRECTED: Added project_id parameter
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    duration, transcript = data.get('durationSeconds'), data.get('transcript')
    if not isinstance(duration, (int, float)) or not transcript:
        return jsonify({'error': 'durationSeconds and transcript are required.'}), 400
    try:
        result = analyze_transcript_with_gemini(uid, project_id, transcript, duration)
        return jsonify({
            "status": "success", "message": "Session logged and analysis complete.",
            "sessionId": result["sessionId"],
            "creditsDeducted": result["cost"], "remainingCredits": result["remaining"]
        }), 200
    except Exception as e:
        logger.error(f"Failed to process end of session for project {project_id}: {e}")
        return jsonify({'error': 'Failed to process session analysis.'}), 500

@app.route('/api/projects/<string:project_id>/sessions/<string:session_id>', methods=['GET'])
def get_session_details(project_id, session_id):
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    try:
        session_ref = db_ref.child(f'projects/{uid}/{project_id}/practiceSessions/{session_id}')
        session_data = session_ref.get()
        if not session_data:
            return jsonify({'error': 'Session not found or access denied.'}), 404
        return jsonify(session_data), 200
    except Exception as e:
        logger.error(f"Failed to retrieve session {session_id} for user {uid}: {e}")
        return jsonify({'error': 'An internal server error occurred.'}), 500

# -----------------------------------------------------------------------------
# 6. CREDIT & ADMIN ENDPOINTS
# -----------------------------------------------------------------------------

@app.route('/api/user/request-credits', methods=['POST'])
def request_credits():
    uid = verify_token(request.headers.get('Authorization'))
    if not uid: return jsonify({'error': 'Unauthorized'}), 401
    try:
        data = request.get_json()
        if not data or 'requested_credits' not in data: return jsonify({'error': 'requested_credits is required'}), 400
        request_ref = db_ref.child('credit_requests').push()
        request_ref.set({
            'requestId': request_ref.key, 'userId': uid,
            'requested_credits': data['requested_credits'], 'status': 'pending',
            'requestedAt': datetime.utcnow().isoformat() + "Z"
        })
        return jsonify({'success': True, 'requestId': request_ref.key})
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/api/admin/credit_requests', methods=['GET'])
def list_credit_requests():
    try:
        verify_admin(request.headers.get('Authorization'))
        requests_data = db_ref.child('credit_requests').get() or {}
        return jsonify(list(requests_data.values()))
    except PermissionError as e: return jsonify({'error': str(e)}), 403
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/api/admin/credit_requests/<string:request_id>', methods=['PUT'])
def process_credit_request(request_id):
    try:
        admin_uid = verify_admin(request.headers.get('Authorization'))
        req_ref = db_ref.child(f'credit_requests/{request_id}')
        req_data = req_ref.get()
        if not req_data: return jsonify({'error': 'Credit request not found'}), 404
        decision = request.json.get('decision')
        if decision not in ['approved', 'declined']: return jsonify({'error': 'Decision must be "approved" or "declined"'}), 400
        if decision == 'approved':
            user_ref = db_ref.child(f'users/{req_data["userId"]}')
            user_data = user_ref.get()
            if user_data:
                new_total = user_data.get('credits', 0) + int(req_data.get('requested_credits', 0))
                user_ref.update({'credits': new_total})
        req_ref.update({'status': decision, 'processedBy': admin_uid, 'processedAt': datetime.utcnow().isoformat() + "Z"})
        return jsonify({'success': True, 'message': f'Request {decision}.'})
    except PermissionError as e: return jsonify({'error': str(e)}), 403
    except Exception as e: return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<string:uid>/credits', methods=['PUT'])
def admin_update_credits(uid):
    try:
        verify_admin(request.headers.get('Authorization'))
        add_credits = request.json.get('add_credits')
        if add_credits is None: return jsonify({'error': 'add_credits is required'}), 400
        user_ref = db_ref.child(f'users/{uid}')
        user_data = user_ref.get()
        if not user_data: return jsonify({'error': 'User not found'}), 404
        new_total = user_data.get('credits', 0) + int(add_credits)
        user_ref.update({'credits': new_total})
        return jsonify({'success': True, 'new_total_credits': new_total})
    except PermissionError as e: return jsonify({'error': str(e)}), 403
    except Exception as e: return jsonify({'error': str(e)}), 500

# -----------------------------------------------------------------------------
# 7. DEBUGGING ENDPOINT
# -----------------------------------------------------------------------------

@app.route('/api/debug/agent-check', methods=['GET'])
def debug_agent_check():
    try:
        agent_id, api_key = os.environ.get("ELEVENLABS_AGENT_ID"), ELEVENLABS_API_KEY
        if not agent_id or not api_key:
            return jsonify({'error': 'ELEVENLABS_AGENT_ID or ELEVENLABS_API_KEY not set on server'}), 500
        url, headers = f"https://api.elevenlabs.io/v1/agents/{agent_id}", {"xi-api-key": api_key}
        response = requests.get(url, headers=headers)
        if response.ok:
            return jsonify({
                'status': 'success', 'message': 'Agent found and API key is valid.',
                'agent_id': agent_id, 'agent_name': response.json().get('name')
            })
        else:
            return jsonify({
                'status': 'failure', 'message': 'Could not retrieve agent. Check Agent ID and API Key.',
                'agent_id': agent_id, 'statusCode': response.status_code, 'response': response.text
            }), 404
    except Exception as e: return jsonify({'error': str(e)}), 500

# -----------------------------------------------------------------------------
# 8. MAIN EXECUTION
# -----------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 7860))
    app.run(debug=False, host="0.0.0.0", port=port)
