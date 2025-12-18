#!/bin/bash

echo "=========================================="
echo "Starting Deployment Process"
echo "=========================================="

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Initialize database tables
echo "🗄️  Initializing database..."
python -c "from database.connection import init_db; init_db()"

# Check if sample data should be loaded
if [ "$LOAD_SAMPLE_DATA" = "true" ]; then
    echo "🌱 Loading sample data..."
    python init_sample_data.py
else
    echo "⏭️  Skipping sample data (set LOAD_SAMPLE_DATA=true to enable)"
fi

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
