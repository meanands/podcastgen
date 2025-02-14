# Podcast Generator

An AI-powered podcast generator that converts PDF documents into natural-sounding conversations.

[Demo](http://podcastgen-demo.anands.me:3001/)

## Prerequisites

- Docker
- Docker Compose

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone git@github.com:anandrmedia/podcastgen.git
   cd podcastgen
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your OpenAI API key.

4. Configure LLM:
   In `server/src/index.ts`, configure the LLM settings according to your needs:
   ```typescript
   const llm = new LLM({
       baseUrl: "https://api.openai.com/v1/",    // For OpenAI
       // baseUrl: "https://api.deepseek.com/v1", // For Deepseek
       model: "gpt-4",                          // Model name
       apiKey: process.env.OPENAI_API_KEY       // API key from .env
   });
   ```
   Supported LLM providers:
   - OpenAI (api.openai.com)
   - Deepseek (api.deepseek.com)
   - Any compatible API with OpenAI format

5. Create required directories:
   ```bash
   mkdir -p server/src/tmp_data
   mkdir -p server/src/generated-files/scripts
   mkdir -p voices
   ```

6. Download Piper voice models:
   - Download the required .onnx voice models from https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/
   - Place them in the `voices` directory
   Required models (folder structure should exactly be like this):
   - voices/lessac/medium/en_US-lessac-medium.onnx
   - voices/lessac/medium/en_US-lessac-medium.onnx.json
   - voices/kusal/en_US-kusal-medium.onnx
   - voices/kusal/en_US-kusal-medium.onnx.json

7. Start the application:
   ```bash
   docker-compose up
   ```

The application will be available at:
- Web UI: http://localhost:3001
- API: http://localhost:3000

## Usage

1. Open http://localhost:3001 in your browser
2. Upload a PDF file using the "Upload PDF" button
3. Wait for the processing to complete
4. Select the generated script from the sidebar
5. Click "Play" to start the podcast

## Development

To stop the application:
```bash
docker-compose down
```

To rebuild the containers after making changes:
```bash
docker-compose up --build
```

## Troubleshooting

If you encounter any issues:
1. Check the Docker logs:
   ```bash
   docker-compose logs
   ```
2. Ensure all required voice models are in the `voices` directory
3. Verify your OpenAI API key is correct
4. Make sure ports 3000 and 3001 are available on your system

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Third-Party Licenses

This project uses several third-party components, including:
- [Piper](https://github.com/rhasspy/piper) for text-to-speech conversion
- Piper voice models from [rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/)

For detailed license information of third-party components, see [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md).
