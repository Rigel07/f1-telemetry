import os
import sys
from flask import Flask, jsonify

print("Python version:", sys.version)
print("Current working directory:", os.getcwd())
print("Script directory:", os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        "message": "F1 Telemetry Test Server is running!",
        "status": "success",
        "python_version": sys.version,
        "cwd": os.getcwd()
    })

@app.route('/api/test')
def test():
    return jsonify({"test": "API working"})

@app.route('/api/health')
def health():
    return jsonify({"status": "healthy", "service": "f1-telemetry"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
