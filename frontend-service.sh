#!/bin/bash

# Frontend service management script for Connections Workboard
# Usage: ./frontend-service.sh {start|stop|restart|status|dev|prod|build}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.frontend.pid"
LOG_FILE="$SCRIPT_DIR/frontend.log"
PORT=${REACT_APP_PORT:-3000}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if frontend is running by PID file
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        else
            # PID file exists but process is dead, clean it up
            warn "Stale PID file found, cleaning up"
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# Check if any process is using our port
port_in_use() {
    local port=$1
    lsof -ti:$port > /dev/null 2>&1
}

# Get PIDs using our port
get_port_pids() {
    local port=$1
    lsof -ti:$port 2>/dev/null || echo ""
}

# Verify port is actually free
verify_port_free() {
    local port=$1
    local retries=5
    
    while [ $retries -gt 0 ]; do
        if ! port_in_use $port; then
            return 0
        fi
        log "Port $port still in use, waiting..."
        sleep 1
        retries=$((retries - 1))
    done
    
    error "Port $port is still in use after cleanup attempts"
    return 1
}

# Get frontend status
status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        success "Frontend is running (PID: $pid) on port $PORT"
        if curl -s "http://localhost:$PORT" > /dev/null; then
            success "Health check passed ✅"
        else
            warn "Health check failed ❌"
        fi
        return 0
    else
        warn "Frontend is not running"
        return 1
    fi
}

# Start the frontend
start() {
    if is_running; then
        warn "Frontend is already running"
        status
        return 0
    fi

    log "Starting React frontend..."
    
    # Ensure dependencies are installed
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi

    # Start frontend in background
    cd "$SCRIPT_DIR"
    PORT=$PORT BROWSER=none nohup npm start > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"
    
    # Wait a moment and verify it started
    sleep 3
    if is_running; then
        success "Frontend started successfully (PID: $pid)"
        
        # Wait for frontend to be ready
        log "Waiting for frontend to be ready..."
        local retries=30  # React takes longer to start
        while [ $retries -gt 0 ]; do
            if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
                success "Frontend is ready and responding on port $PORT ✅"
                success "Open http://localhost:$PORT in your browser"
                return 0
            fi
            sleep 2
            retries=$((retries - 1))
        done
        
        warn "Frontend started but health check is failing"
        return 1
    else
        error "Failed to start frontend"
        if [ -f "$LOG_FILE" ]; then
            error "Last few lines from log:"
            tail -n 10 "$LOG_FILE"
        fi
        return 1
    fi
}

# Stop the frontend
stop() {
    if ! is_running; then
        warn "Frontend is not running"
        return 0
    fi

    local pid=$(cat "$PID_FILE")
    log "Stopping frontend (PID: $pid)..."
    
    # Try graceful shutdown first
    kill "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    local retries=5
    while [ $retries -gt 0 ] && kill -0 "$pid" 2>/dev/null; do
        sleep 1
        retries=$((retries - 1))
    done
    
    # Force kill if still running
    if kill -0 "$pid" 2>/dev/null; then
        warn "Forcing frontend shutdown..."
        kill -9 "$pid" 2>/dev/null || true
        sleep 1
    fi
    
    # Clean up PID file
    rm -f "$PID_FILE"
    
    if ! kill -0 "$pid" 2>/dev/null; then
        success "Frontend stopped successfully"
        return 0
    else
        error "Failed to stop frontend"
        return 1
    fi
}

# Restart the frontend
restart() {
    log "Restarting frontend..."
    stop
    sleep 1
    start
}

# Development mode (foreground with live logs)
dev() {
    if is_running; then
        warn "Frontend is already running in background. Stopping it first..."
        stop
    fi

    log "Starting frontend in development mode..."
    
    # Ensure dependencies are installed
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi

    cd "$SCRIPT_DIR"
    log "Frontend starting in development mode on port $PORT (Ctrl+C to stop)"
    PORT=$PORT npm start
}

# Production mode (foreground)
prod() {
    if is_running; then
        warn "Frontend is already running in background. Stopping it first..."
        stop
    fi

    log "Starting frontend in production mode..."
    
    # Ensure dependencies are installed and build exists
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi
    
    if [ ! -d "$SCRIPT_DIR/build" ]; then
        log "No production build found, creating one..."
        npm run build
    fi

    cd "$SCRIPT_DIR"
    log "Frontend starting in production mode on port $PORT (Ctrl+C to stop)"
    PORT=$PORT npm run start:prod
}

# Build for production
build() {
    log "Building frontend for production..."
    
    # Ensure dependencies are installed
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi

    cd "$SCRIPT_DIR"
    npm run build
    success "Production build completed in ./build/"
}

# Kill any orphaned node processes on our port
cleanup() {
    log "Cleaning up any orphaned processes on port $PORT..."
    
    # Find and kill processes using our port
    local pids=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$pids" ]; then
        warn "Found processes using port $PORT: $pids"
        echo $pids | xargs kill -9 2>/dev/null || true
        sleep 1
        success "Cleanup completed"
    else
        log "No orphaned processes found"
    fi
    
    # Clean up stale PID file
    rm -f "$PID_FILE"
}

# Show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status|dev|prod|build|cleanup}"
    echo ""
    echo "Commands:"
    echo "  start    - Start frontend in background (development mode)"
    echo "  stop     - Stop background frontend"
    echo "  restart  - Restart background frontend"
    echo "  status   - Show frontend status"
    echo "  dev      - Start frontend in foreground (development mode)"
    echo "  prod     - Start frontend in foreground (production mode)"
    echo "  build    - Build frontend for production"
    echo "  cleanup  - Kill orphaned processes and clean up"
    echo ""
    echo "Environment variables:"
    echo "  REACT_APP_PORT - Frontend port (default: 3000)"
    echo "  NODE_ENV       - Node environment (default: development)"
}

# Main command handling
case "${1:-}" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    build)
        build
        ;;
    cleanup)
        cleanup
        ;;
    *)
        usage
        exit 1
        ;;
esac
