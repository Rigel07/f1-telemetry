import os
import sys
from flask import Flask, jsonify

print("=== F1 Telemetry Minimal Server Starting ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Script directory: {os.path.dirname(os.path.abspath(__file__))}")
print(f"Environment PORT: {os.environ.get('PORT', 'Not set')}")

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({
        "message": "F1 Telemetry Server is RUNNING!",
        "status": "success",
        "python_version": sys.version,
        "cwd": os.getcwd(),
        "port": os.environ.get('PORT', 'Not set')
    })

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "service": "f1-telemetry-minimal"})

@app.route('/api/test')
def test():
    return jsonify({"test": "Working perfectly!"})

if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', 5000))
        print(f"=== Starting Flask server on port {port} ===")
        app.run(host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        print(f"=== ERROR STARTING SERVER: {e} ===")
        import traceback
        traceback.print_exc()
        sys.exit(1)
