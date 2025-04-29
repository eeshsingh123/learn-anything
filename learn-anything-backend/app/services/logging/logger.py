import logging

# Create a custom logging
logger = logging.getLogger("fastapi_app")
logger.setLevel(logging.DEBUG)  # Capture everything from DEBUG and up

# Create handlers
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# Create formatter and add it to the handlers
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s", "%Y-%m-%d %H:%M:%S"
)
console_handler.setFormatter(formatter)

# Add handlers to the logging
if not logger.handlers:  # Prevent duplicate handlers
    logger.addHandler(console_handler)

# Make sure the logging propagates messages
logger.propagate = True