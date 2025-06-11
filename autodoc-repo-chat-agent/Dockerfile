FROM modular/max-full

WORKDIR /app

COPY pyproject.toml ./
COPY main.py ./

RUN pip install --root-user-action=ignore -e .

# Start agent when end-user connects to interactive terminal
RUN printf 'clear\nexec poe agent\n' > /root/.bashrc

# Start MAX Serve when the container starts
RUN printf '#!/bin/bash\nset -e\npoe server &\ntail -f /dev/null\n' > /usr/local/bin/startup.sh && \
    chmod +x /usr/local/bin/startup.sh

ENTRYPOINT ["/usr/local/bin/startup.sh"]
