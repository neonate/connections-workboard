#!/bin/bash

# Master management script for Connections Workboard
# Usage: ./services.sh {start|stop|restart|status|dev|build|cleanup} [frontend|backend|all]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_SCRIPT="$SCRIPT_DIR/backend/service.sh"
FRONTEND_SCRIPT="$SCRIPT_DIR/frontend-service.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

log() {
    echo -e "${CYAN}[MASTER]${NC} $1"
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

header() {
    echo -e "${BOLD}${BLUE}================================${NC}"
    echo -e "${BOLD}${BLUE} $1${NC}"
    echo -e "${BOLD}${BLUE}================================${NC}"
}

# Make scripts executable
ensure_executable() {
    chmod +x "$BACKEND_SCRIPT" 2>/dev/null || true
    chmod +x "$FRONTEND_SCRIPT" 2>/dev/null || true
}

# Execute command on specified service
execute_service_command() {
    local command=$1
    local service=$2
    
    case $service in
        backend)
            header "BACKEND: $command"
            "$BACKEND_SCRIPT" "$command"
            ;;
        frontend)
            header "FRONTEND: $command"
            "$FRONTEND_SCRIPT" "$command"
            ;;
        all)
            if [ "$command" = "dev" ]; then
                dev_all
            elif [ "$command" = "start" ]; then
                start_all
            elif [ "$command" = "stop" ]; then
                stop_all
            elif [ "$command" = "restart" ]; then
                restart_all
            elif [ "$command" = "status" ]; then
                status_all
            elif [ "$command" = "cleanup" ]; then
                cleanup_all
            elif [ "$command" = "build" ]; then
                build_all
            else
                error "Command '$command' not supported for 'all' services"
                exit 1
            fi
            ;;
        *)
            error "Unknown service: $service"
            exit 1
            ;;
    esac
}

# Start all services
start_all() {
    header "STARTING ALL SERVICES"
    
    log "Starting backend first..."
    "$BACKEND_SCRIPT" start
    
    log "Starting frontend..."
    "$FRONTEND_SCRIPT" start
    
    success "All services started successfully!"
    echo ""
    success "🌐 Frontend: http://localhost:3000"
    success "🔧 Backend:  http://localhost:3001"
    success "🏥 Health:   http://localhost:3001/api/health"
}

# Stop all services
stop_all() {
    header "STOPPING ALL SERVICES"
    
    log "Stopping frontend..."
    "$FRONTEND_SCRIPT" stop || true
    
    log "Stopping backend..."
    "$BACKEND_SCRIPT" stop || true
    
    success "All services stopped"
}

# Restart all services
restart_all() {
    header "RESTARTING ALL SERVICES"
    stop_all
    sleep 2
    start_all
}

# Status of all services
status_all() {
    header "SERVICE STATUS"
    
    echo -e "${BOLD}Backend:${NC}"
    "$BACKEND_SCRIPT" status
    echo ""
    
    echo -e "${BOLD}Frontend:${NC}"
    "$FRONTEND_SCRIPT" status
    echo ""
    
    # Overall summary
    local backend_running=$("$BACKEND_SCRIPT" status >/dev/null 2>&1 && echo "yes" || echo "no")
    local frontend_running=$("$FRONTEND_SCRIPT" status >/dev/null 2>&1 && echo "yes" || echo "no")
    
    echo -e "${BOLD}Overall Status:${NC}"
    if [ "$backend_running" = "yes" ] && [ "$frontend_running" = "yes" ]; then
        success "✅ All services are running"
        echo ""
        success "🌐 Application: http://localhost:3000"
        success "🔧 API:         http://localhost:3001"
    elif [ "$backend_running" = "yes" ] || [ "$frontend_running" = "yes" ]; then
        warn "⚠️  Some services are running"
    else
        warn "❌ No services are running"
    fi
}

# Development mode - run both in foreground with logs
dev_all() {
    header "DEVELOPMENT MODE"
    
    # Stop any background services first
    log "Stopping any background services..."
    "$BACKEND_SCRIPT" stop 2>/dev/null || true
    "$FRONTEND_SCRIPT" stop 2>/dev/null || true
    
    log "Starting development environment..."
    log "This will run both frontend and backend in the foreground"
    log "Press Ctrl+C to stop both services"
    echo ""
    
    # Function to handle cleanup on exit
    cleanup_on_exit() {
        log "Shutting down development environment..."
        kill 0  # Kill all processes in the process group
        exit 0
    }
    
    # Set up signal handlers
    trap cleanup_on_exit SIGINT SIGTERM
    
    # Start backend in background
    log "Starting backend..."
    "$BACKEND_SCRIPT" start
    
    # Start frontend in foreground (this will block)
    log "Starting frontend in foreground..."
    sleep 2
    "$FRONTEND_SCRIPT" dev
}

# Build all for production
build_all() {
    header "BUILDING FOR PRODUCTION"
    
    log "Building frontend..."
    "$FRONTEND_SCRIPT" build
    
    success "Production build completed!"
    log "Frontend build is in ./build/"
    log "Backend is ready for production deployment"
}

# Cleanup all services
cleanup_all() {
    header "CLEANING UP ALL SERVICES"
    
    log "Cleaning up backend..."
    "$BACKEND_SCRIPT" cleanup
    
    log "Cleaning up frontend..."
    "$FRONTEND_SCRIPT" cleanup
    
    success "Cleanup completed for all services"
}

# Show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status|dev|build|cleanup} [service]"
    echo ""
    echo "Commands:"
    echo "  start    - Start services"
    echo "  stop     - Stop services"
    echo "  restart  - Restart services"
    echo "  status   - Show service status"
    echo "  dev      - Start in development mode (foreground)"
    echo "  build    - Build for production"
    echo "  cleanup  - Kill orphaned processes and clean up"
    echo ""
    echo "Services:"
    echo "  frontend - React frontend only"
    echo "  backend  - Node.js backend only"
    echo "  all      - Both services (default)"
    echo ""
    echo "Examples:"
    echo "  $0 start           # Start both services"
    echo "  $0 start backend   # Start only backend"
    echo "  $0 dev             # Development mode (both services)"
    echo "  $0 status          # Check status of all services"
    echo "  $0 cleanup         # Clean up all services"
    echo ""
    echo "URLs when running:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:3001"
    echo "  Health:   http://localhost:3001/api/health"
}

# Main execution
main() {
    local command=${1:-}
    local service=${2:-all}
    
    # Ensure scripts are executable
    ensure_executable
    
    # Validate inputs
    if [ -z "$command" ]; then
        usage
        exit 1
    fi
    
    # Execute the command
    case $command in
        start|stop|restart|status|dev|build|cleanup)
            execute_service_command "$command" "$service"
            ;;
        *)
            error "Unknown command: $command"
            usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
