import sys
import os
import socket
import threading
import time
import uvicorn
import webview

def find_available_port(start_port=8000, max_port=8100):
    """Finds an available TCP port in the specified range."""
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    raise IOError(f"No available port found in range {start_port}-{max_port}")

def is_port_listening(port, host='127.0.0.1'):
    """Checks if a port is listening on the host."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex((host, port)) == 0

def start_api_server(port):
    """Runs the FastAPI server using Uvicorn."""
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, log_level="info")

def main():
    # 1. Find a free port starting from 8000
    try:
        port = find_available_port(8000, 8100)
        print(f"[Desktop App] Selected Port: {port}")
    except IOError as e:
        print(f"[Desktop App] Error: {e}")
        sys.exit(1)

    # 2. Launch FastAPI in a separate daemon thread
    server_thread = threading.Thread(target=start_api_server, args=(port,), daemon=True)
    server_thread.start()

    # 3. Wait for FastAPI to start responding
    retries = 30
    server_started = False
    print("[Desktop App] Initializing backend server...")
    while retries > 0:
        if is_port_listening(port):
            server_started = True
            break
        time.sleep(0.2)
        retries -= 1

    if not server_started:
        print("[Desktop App] Error: Backend server failed to start within the timeout period.")
        sys.exit(1)

    print("[Desktop App] Backend server started successfully. Launching GUI...")

    # 4. Create and launch the native GUI window with pywebview
    webview.create_window(
        title="Inventory & User Management",
        url=f"http://127.0.0.1:{port}",
        width=1280,
        height=800,
        resizable=True,
        min_size=(900, 600)
    )
    
    # Start the pywebview main loop
    webview.start()
    
    print("[Desktop App] Window closed. Exiting.")

if __name__ == "__main__":
    main()
