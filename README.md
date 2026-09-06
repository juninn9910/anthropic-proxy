# anthropic-proxy

경산자인학교 과정중심평가 앱이 Claude API를 호출할 때 거치는 중계 서버입니다.
API 키가 브라우저에 노출되지 않도록 하는 것이 목적입니다.

## 필요한 환경 변수 (Vercel → Settings → Environments → Production)

| 이름 | 설명 | 필수 |
|------|------|------|
| `ANTHROPIC_API_KEY` | Anthropic API 키 (`sk-ant-api...`) | ✅ |
| `APP_TOKEN` | 앱이 보내는 이용 키. 아무 긴 문자열이나 가능 | ✅ |
| `ALLOWED_ORIGINS` | 호출을 허용할 주소 목록(쉼표 구분). 비우면 출처 제한 없음 | 선택 |

`ALLOWED_ORIGINS` 예시:

```
https://juninn9910.github.io,http://127.0.0.1:8000
```

환경 변수를 바꾼 뒤에는 **반드시 Redeploy** 해야 반영됩니다.

## 동작

- `POST /api/claude` 만 받습니다.
- 요청 헤더에 `x-app-token`이 있어야 하고, `APP_TOKEN`과 일치해야 합니다.
- 본문은 Anthropic Messages API 형식 그대로 전달됩니다.

## 한계

앱이 브라우저에서 동작하므로 `APP_TOKEN`은 개발자 도구로 볼 수 있습니다.
주소만 알면 누구나 쓸 수 있던 상태보다는 낫지만, 완전한 차단은 아닙니다.
토큰이 새면 Vercel에서 `APP_TOKEN` 값만 바꾸고 재배포하면 됩니다.
