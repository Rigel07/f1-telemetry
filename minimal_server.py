from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return jsonify({
        "message": "Hello from F1 Telemetry!",
        "status": "running",
        "port": os.environ.get('PORT', 'not set')
    })

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting minimal server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
