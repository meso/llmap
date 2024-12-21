# OpenAI
curl http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key_value" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "こんにちは。あなたの名前はなんですか？"}],
    "temperature": 1.0
  }'

## レスポンス例
{
  "id": "chatcmpl-AVvHRYitGoeUQRVPTRcDZj0SYeNBC",
  "object": "chat.completion",
  "created": 1732171717,
  "model": "gpt-4o-mini-2024-07-18",
  "choices": [{
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "こんにちは！私はAIアシスタントで、特に名前はありませんが、お手伝いできることがあれば教えてください。どうぞよろしくお願いします！",
        "refusal": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  }],
  "usage": {
    "prompt_tokens": 17,
    "completion_tokens": 35,
    "total_tokens": 52,
    "prompt_tokens_details": {
      "cached_tokens": 0,
      "audio_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "audio_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    }
  },
  "system_fingerprint": "fp_0705bf87c0"
}

# Anthropic Sample
curl http://localhost:8787/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: claude_api_key" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-haiku-20241022",
    "messages": [{"role": "user", "content": "こんにちは。あなたの名前はなんですか？"}],
    "max_tokens": 1024
  }'

## レスポンス例
{
  "id":"msg_01NzVmooqeRYGiHogyKwb9H8",
  "type":"message",
  "role":"assistant",
  "model":"claude-3-5-haiku-20241022",
  "content":[{
    "type":"text",
    "text":"こんにちは！私の名前はClaudeです。人工知能のアシスタントです。どのようなお手伝いができるでしょうか?"
  }],
  "stop_reason":"end_turn",
  "stop_sequence":null,
  "usage":{"input_tokens":25,"output_tokens":48}
}

