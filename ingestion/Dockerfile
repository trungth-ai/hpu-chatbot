FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8787
# Mặc định chạy HTTP trigger; đồng bộ thủ công: docker compose run --rm ingest python sync.py --all
CMD ["python", "server.py"]
