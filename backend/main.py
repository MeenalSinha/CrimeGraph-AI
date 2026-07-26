import sys
import os

# Add current directory to path so it can find app.main
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app as fastapi_app
from a2wsgi import ASGIMiddleware
import flask
import logging

logger = logging.getLogger()

# Create a WSGI app using a2wsgi
wsgi_app = ASGIMiddleware(fastapi_app)

def handler(request: flask.Request):
    try:
        # request is a flask request
        environ = request.environ
        
        # We need to capture the response
        status_code = [200]
        headers = []
        
        def start_response(status, response_headers, exc_info=None):
            status_code[0] = int(status.split(' ')[0])
            headers.extend(response_headers)
        
        # Call the WSGI app
        result = wsgi_app(environ, start_response)
        
        # The result is an iterable (usually a generator of bytes)
        body = b"".join(result)
        
        response = flask.make_response(body, status_code[0])
        for k, v in headers:
            if k.lower() not in ('content-length', 'content-type'):
                response.headers[k] = v
                
        # Set content type from headers if present
        for k, v in headers:
            if k.lower() == 'content-type':
                response.content_type = v
                break
                
        return response
    except Exception as e:
        logger.exception("Error during ASGI processing")
        return flask.make_response(f"Internal Server Error: {str(e)}", 500)
