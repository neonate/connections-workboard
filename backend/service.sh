#!/bin/bash

# Backend management script for Connections Workboard
# Usage: ./manage.sh {start|stop|restart|status|dev}

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/.server.pid"
LOG_FILE="$SCRIPT_DIR/server.log"
SERVER_SCRIPT="$SCRIPT_DIR/server.js"
PORT=${PORT:-3001}

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

# Check if server is running by PID file
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

# Get server status
status() {
    if is_running; then
        local pid=$(cat "$PID_FILE")
        success "Server is running (PID: $pid) on port $PORT"
        if curl -s "http://localhost:$PORT/api/health" > /dev/null; then
            success "Health check passed ✅"
        else
            warn "Health check failed ❌"
        fi
        return 0
    else
        warn "Server is not running"
        return 1
    fi
}

# Start the server
start() {
    # Check for any existing processes first
    log "Checking for existing processes on port $PORT..."
    
    if port_in_use $PORT; then
        local port_pids=$(get_port_pids $PORT)
        warn "Port $PORT is already in use by PID(s): $port_pids"
        
        if is_running; then
            warn "Our managed server is already running"
            status
            return 0
        else
            error "Port $PORT is occupied by unmanaged process(es): $port_pids"
            error "Please stop these processes manually or run: $0 cleanup"
            return 1
        fi
    fi

    if is_running; then
        warn "Server is already running (PID file exists but port is free - this shouldn't happen)"
        status
        return 0
    fi

    log "Starting backend server on port $PORT..."
    
    # Ensure dependencies are installed
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi

    # Start server in background
    cd "$SCRIPT_DIR"
    nohup node "$SERVER_SCRIPT" > "$LOG_FILE" 2>&1 &
    local pid=$!
    echo $pid > "$PID_FILE"
    
    # Wait a moment and verify it started
    sleep 2
    if is_running; then
        success "Server started successfully (PID: $pid)"
        
        # Verify the port is actually being used by our process
        if ! port_in_use $PORT; then
            error "Server process exists but port $PORT is not in use"
            return 1
        fi
        
        local port_pids=$(get_port_pids $PORT)
        if [ "$port_pids" != "$pid" ]; then
            warn "Port $PORT is being used by different PID(s): $port_pids (expected: $pid)"
        fi
        
        # Wait for health check
        log "Waiting for server to be ready..."
        local retries=10
        while [ $retries -gt 0 ]; do
            if curl -s "http://localhost:$PORT/api/health" > /dev/null 2>&1; then
                success "Server is ready and responding on port $PORT ✅"
                success "Backend API available at: http://localhost:$PORT"
                return 0
            fi
            sleep 1
            retries=$((retries - 1))
        done
        
        warn "Server started but health check is failing"
        return 1
    else
        error "Failed to start server"
        if [ -f "$LOG_FILE" ]; then
            error "Last few lines from log:"
            tail -n 10 "$LOG_FILE"
        fi
        return 1
    fi
}

# Stop the server
stop() {
    local had_managed_process=false
    
    if is_running; then
        local pid=$(cat "$PID_FILE")
        log "Stopping managed server (PID: $pid)..."
        had_managed_process=true
        
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
            warn "Forcing server shutdown..."
            kill -9 "$pid" 2>/dev/null || true
            sleep 1
        fi
        
        # Clean up PID file
        rm -f "$PID_FILE"
        
        if kill -0 "$pid" 2>/dev/null; then
            error "Failed to stop managed server (PID: $pid)"
        else
            success "Managed server stopped successfully"
        fi
    fi
    
    # Check if port is still in use by other processes
    if port_in_use $PORT; then
        local port_pids=$(get_port_pids $PORT)
        warn "Port $PORT is still in use by PID(s): $port_pids"
        
        if [ "$had_managed_process" = false ]; then
            warn "No managed server was running, but port $PORT is occupied"
        fi
        return 1
    else
        if [ "$had_managed_process" = false ]; then
            log "No server was running"
        fi
        verify_port_free $PORT
        return $?
    fi
}

# Restart the server
restart() {
    log "Restarting server..."
    stop
    sleep 1
    start
}

# Development mode (foreground with live logs)
dev() {
    if is_running; then
        warn "Server is already running in background. Stopping it first..."
        stop
    fi

    log "Starting server in development mode..."
    
    # Ensure dependencies are installed
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        log "Installing dependencies..."
        cd "$SCRIPT_DIR"
        npm install
    fi

    cd "$SCRIPT_DIR"
    log "Server running on port $PORT (Ctrl+C to stop)"
    node "$SERVER_SCRIPT"
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
    echo "Usage: $0 {start|stop|restart|status|dev|cleanup}"
    echo ""
    echo "Commands:"
    echo "  start    - Start server in background"
    echo "  stop     - Stop background server"
    echo "  restart  - Restart background server"
    echo "  status   - Show server status"
    echo "  dev      - Start server in foreground (development mode)"
    echo "  cleanup  - Kill orphaned processes and clean up"
    echo ""
    echo "Environment variables:"
    echo "  PORT     - Server port (default: 3001)"
    echo "  NODE_ENV - Node environment (default: development)"
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
    cleanup)
        cleanup
        ;;
    *)
        usage
        exit 1
        ;;
esac
