.PHONY: install dev clean Build Help

help:
	@echo "Available commands:"
	@echo "  make install  - Install project dependencies"
	@echo "  make dev      - Start the Vite local development server"
	@echo "  make build    - Build the application for production"
	@echo "  make clean    - Remove node_modules and lock files"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

clean:
	rm -rf node_modules package-lock.json