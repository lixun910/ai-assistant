# [DEPRECATED] 

## Please use https://github.com/lixun910/openassistant

# Introduction

AI-Assistant helps adding AI capabilities to your React SPA  applications while keeping your data secure and private.

## License

MIT License.

## Features

- Support for multiple AI models.
  - OpenAI <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" width="20" height="20" alt="OpenAI logo" style="vertical-align: middle;">
  - Gemini <img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg" width="20" height="20" alt="Google logo" style="vertical-align: middle;">
  - Ollama <img src="https://ollama.com/public/assets/c889cc0d-cb83-4c46-a98e-0d0e273151b9/42f6b28d-9117-48cd-ac0d-44baaf5c178e.png" width="20" height="20" alt="Ollama logo" style="vertical-align: middle;">
- Built-in "Screenshot to Ask" feature.
- Built-in "Talk to Ask" feature.
- Support custom functions.
  - support calling existing actions
  - support custom message UI.
- Addons: 
  - query your dataset using duckdb https://www.npmjs.com/package/@react-ai-assist/duckdb
  - map your data
  - analyze and visualize your data  https://www.npmjs.com/package/@react-ai-assist/echarts
  - ...

## Usage

You can use the `AiAssistant` component to add AI capabilities to your React SPA applications directly.

```tsx
import { AiAssistant } from 'react-ai-assistant';
import 'react-ai-assist/dist/index.css';

<AiAssistant 
  modelProvider="openai"
  model="gpt-4o"
  apiKey="your-api-key"
  welcomeMessage="Hello, how can I help you today?"
  instructions="You are a helpful assistant."
  functions={[]}
/>
```
See an example:
| kepler.gl AI Assistant (kepler.gl) |  GeoDa.AI AI Assistant (geoda.ai)    |
|----|----|
| [<img width="215" alt="Screenshot 2024-12-08 at 9 12 22 PM" src="https://github.com/user-attachments/assets/edc11aee-8945-434b-bec9-cc202fee547c">](https://kepler.gl) |  [<img width="215" alt="Screenshot 2024-12-08 at 9 13 43 PM" src="https://github.com/user-attachments/assets/de418af5-7663-48fb-9410-74b4750bc944">](https://geoda.ai) |

### Screenshot to Ask

Click to watch the video
[<img width="215" alt="Screenshot 2024-12-08 at 9 13 43 PM" src="https://github.com/user-attachments/assets/d87fdb72-d7af-488f-bf4d-3afa89a5e09f">](https://geoda.ai/img/highlight-screenshot.mp4)

### Talk to Ask

Click to watch the video
[<img width="215" alt="Screenshot 2024-12-08 at 9 13 43 PM" src="https://github.com/user-attachments/assets/d87fdb72-d7af-488f-bf4d-3afa89a5e09f">](https://geoda.ai/img/highlight-ai-talk.mp4)

## Installation

```bash
npm install react-ai-assistant
```

## Usage

```tsx
import { AiAssistant } from 'react-ai-assistant';
import 'react-ai-assist/dist/index.css';

<AiAssistant 
  modelProvider="openai"
  model="gpt-4o"
  apiKey="your-api-key"
  welcomeMessage="Hello, how can I help you today?"
  instructions="You are a helpful assistant."
  functions={[]}
/>
```

You can use `useAssistant` hook to get the assistant instance directly. 

```tsx
import { useAssistant } from 'react-ai-assistant';

const {initializeAssistant, addAdditionalContext} = useAssistant(assistantProps);
```

The package provides utiles to manage the assistant state.

For example, you can use it to create a configuration UI for your assistant:

|  |  |
|----|----|
| <img width="215" alt="Screenshot 2024-12-08 at 9 12 49 PM" src="https://github.com/user-attachments/assets/0beae014-efb0-447a-8e11-3cd16f5cae5b"> | |

## Tutorial
See the [example](./example) for more details.

