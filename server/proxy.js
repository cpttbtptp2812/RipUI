// e:\owner\aitop\server\proxy.js
import http from 'http';

const PROXY_PORT = 8900;

// 模拟已捕获的请求遥测历史
let telemetries = [
  {
    id: "req-1024",
    clientApp: "Cursor Composer",
    model: "claude-3-5-sonnet",
    status: "200 OK",
    timestamp: "12:08:15",
    latencyMs: 382,
    tokens: { prompt: 1420, completion: 430, total: 1850 },
    costUSD: 0.0108,
    actionType: "AST_SLICE_PATCH",
    targetFile: "src/components/Header.tsx",
    toolCall: "mcp__ast_symbol_slice",
    riskLevel: "SAFE"
  },
  {
    id: "req-1025",
    clientApp: "Claude Code CLI",
    model: "claude-3-7-sonnet",
    status: "200 OK",
    timestamp: "12:09:40",
    latencyMs: 512,
    tokens: { prompt: 2150, completion: 610, total: 2760 },
    costUSD: 0.0156,
    actionType: "BASH_RUN",
    targetFile: "tests/auth.spec.ts",
    toolCall: "bash_exec (npm test)",
    riskLevel: "SAFE"
  }
];

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 监控状态接口
  if (req.url === '/api/stats' && req.method === 'GET') {
    const totalTokens = telemetries.reduce((acc, cur) => acc + cur.tokens.total, 0);
    const totalCost = telemetries.reduce((acc, cur) => acc + cur.costUSD, 0);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      activeClients: ["Cursor", "Claude Code", "Aider"],
      proxyPort: PROXY_PORT,
      status: "LISTENING",
      totalRequests: telemetries.length,
      totalTokens,
      totalCostUSD: totalCost.toFixed(4),
      recentLogs: telemetries
    }));
    return;
  }

  // 模拟透明代理 OpenAI/Anthropic 接口并记录
  if (req.url.startsWith('/v1/chat/completions') || req.url.startsWith('/v1/messages')) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      console.log(`[AITop Proxy] 捕获大模型请求: ${req.url}`);
      // 模拟返回
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: "chatcmpl-aitop-" + Date.now(),
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model: "gpt-4o",
        choices: [{
          index: 0,
          message: { role: "assistant", content: "AITop 代理透传成功！" },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 120, completion_tokens: 30, total_tokens: 150 }
      }));
    });
    return;
  }

  res.writeHead(404);
  res.end('AITop Gateway Ready');
});

server.listen(PROXY_PORT, () => {
  console.log(`🚀 [AITop Local Proxy] 运行在 http://localhost:${PROXY_PORT}`);
});

