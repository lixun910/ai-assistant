import axios from 'axios';

interface ConnectionTestResult {
  service: string;
  success: boolean;
  message: string;
}

export async function testApiKey({
  apiKey,
  modelProvider,
  modelName,
  baseUrl,
}: {
  apiKey: string;
  modelProvider: string;
  modelName: string;
  baseUrl: string;
}): Promise<boolean> {
  if (modelProvider.toLowerCase() === 'openai') {
    return testOpenAIChatGPTConnection(apiKey, modelName);
  } else if (modelProvider.toLowerCase() === 'google') {
    return testGeminiConnection(apiKey, modelName);
  } else if (modelProvider.toLowerCase() === 'ollama') {
    return testOllamConnection(modelName, baseUrl);
  } else {
    return false;
  }
}

export async function testOpenAIChatGPTConnection(
  apiKey: string,
  modelName: string
): Promise<boolean> {
  const result: ConnectionTestResult = {
    service: 'OpenAI',
    success: false,
    message: '',
  };

  // Test OpenAI connection
  try {
    await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
          },
          {
            role: 'user',
            content: 'Hello!',
          },
        ],
        max_tokens: 5,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    result.success = true;
    result.message = 'Connection successful';
  } catch (error) {
    result.success = false;
    result.message = `${error}`;
  }

  return result.success;
}

export async function testGeminiConnection(
  apiKey: string,
  modelName: string
): Promise<boolean> {
  const result: ConnectionTestResult = {
    service: 'Gemini',
    success: false,
    message: '',
  };

  // Test Gemini connection
  try {
    await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: 'Hello',
              }
            ]
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    result.success = true;
    result.message = 'Connection successful';
  } catch (error) {
    result.success = false;
    result.message = `${error}`;
  }

  return result.success;
}

export async function testOllamConnection(
  modelName: string,
  baseUrl: string
): Promise<boolean> {
  const results: ConnectionTestResult = {
    service: 'Ollma',
    success: false,
    message: '',
  };

  // Test Ollama connection
  try {
    await axios.post(`${baseUrl}/api/generate`, {
      model: modelName,
      prompt: 'hello',
    });
    results.success = true;
    results.message = 'Connection successful';
  } catch (error) {
    results.success = false;
    results.message = `${error}`;
  }

  return results.success;
}
