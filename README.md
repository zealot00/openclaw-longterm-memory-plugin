# openclaw-longterm-memory-plugin

OpenClaw Context Engine 插件，提供增强的长期记忆管理能力。

## 功能特性

### 核心功能

| 功能 | 描述 | 优先级 |
|------|------|--------|
| Narrative Fact 存储 | 存储和检索叙事性事实 | P0 |
| Entity 追踪 | 实体管理和信心度追踪 | P0 |
| Context 增强 | 在上下文组装时注入相关事实 | P0 |
| 向量搜索 | 基于 embedding 的语义检索 | P1 |
| Reflect 定时任务 | 自动更新实体信心度 | P2 |
| 回退机制 | API 失败时优雅降级 | P2 |

### 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                   OpenClaw Gateway                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          LongtermMemoryEngine (Context Engine)      │   │
│  │                                                      │   │
│  │  1. bootstrap()    → 初始化会话                     │   │
│  │  2. ingest()       → 摄入消息                       │   │
│  │  3. assemble()     → 组装上下文 + 注入事实           │   │
│  │  4. compact()      → 委托给 legacy                  │   │
│  │  5. dispose()      → 清理资源                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Memory Console                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ Narrative   │  │   Entity    │  │    Memory      │   │
│  │   Facts    │  │   Store     │  │    Store       │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 安装

```bash
npm install openclaw-longterm-memory-plugin
```

## 配置

在 `openclaw.json` 中配置：

```json
{
  "plugins": {
    "slots": {
      "contextEngine": "longterm-memory"
    }
  },
  "pluginsConfig": {
    "longterm-memory": {
      "memoryConsoleUrl": "http://localhost:3000",
      "apiToken": "your-token",
      "maxNarrativeFacts": 5,
      "entityConfidenceThreshold": 0.7,
      "autoReflectInterval": 3600
    }
  }
}
```

### 配置参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `memoryConsoleUrl` | string | `http://localhost:3000` | Memory Console API 地址 |
| `apiToken` | string | - | API 认证 Token |
| `maxNarrativeFacts` | number | `5` | 每次上下文注入的最大事实数 |
| `entityConfidenceThreshold` | number | `0.7` | 实体信心度阈值 |
| `autoReflectInterval` | number | `3600` | Reflect 任务间隔（秒） |

## API

### Context Engine 接口

```typescript
interface ContextEngine {
  readonly info: ContextEngineInfo;
  
  bootstrap(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
  }): Promise<BootstrapResult>;
  
  ingest(params: {
    sessionId: string;
    sessionKey?: string;
    message: AgentMessage;
    isHeartbeat?: boolean;
  }): Promise<IngestResult>;
  
  assemble(params: {
    sessionId: string;
    sessionKey?: string;
    messages: AgentMessage[];
    tokenBudget?: number;
  }): Promise<AssembleResult>;
  
  compact(params: {
    sessionId: string;
    sessionKey?: string;
    sessionFile: string;
    tokenBudget?: number;
    force?: boolean;
    customInstructions?: string;
  }): Promise<CompactResult>;
  
  dispose?(): Promise<void>;
}
```

### 客户端接口

```typescript
interface MemoryConsoleClient {
  // Narrative Facts
  createNarrativeFact(fact: Omit<NarrativeFact, 'id'>): Promise<NarrativeFact>;
  searchNarrativeFacts(query: string, options?: SearchOptions): Promise<NarrativeFact[]>;
  
  // Entities
  createEntity(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity>;
  getEntity(name: string): Promise<Entity | null>;
  updateEntity(id: string, updates: Partial<Entity>): Promise<Entity>;
  listEntities(): Promise<Entity[]>;
  
  // Generic Memory
  createMemory(memory: Omit<MemoryEntry, 'id'>): Promise<MemoryEntry>;
  searchMemories(query: string, options?: SearchOptions): Promise<MemoryEntry[]>;
}
```

### 数据模型

```typescript
type FactType = 'world' | 'experience' | 'opinion' | 'observation';

interface NarrativeFact {
  id: string;
  content: string;           // 事实内容
  entities: string[];        // 关联实体名
  confidence: number;         // 信心度 0-1
  factType: FactType;        // 事实类型
  createdAt: Date;
  source?: string;           // 来源
  sessionId?: string;        // 会话ID
}

interface Entity {
  id: string;
  name: string;              // 实体名（唯一）
  description?: string;
  facts: string[];           // NarrativeFact IDs
  confidence: number;         // 信心度 0-1
  lastReflected?: Date;      // 上次反思时间
  createdAt: Date;
  updatedAt: Date;
}
```

## 开发

### 运行测试

```bash
npm test
```

### 构建

```bash
npm run build
```

### 项目结构

```
src/
├── index.ts                  # 插件入口
├── engine.ts                 # Context Engine 实现
├── memory-console-client.ts  # HTTP 客户端
└── types/
    ├── context-engine.ts    # 接口定义
    └── index.ts             # 内部类型

tests/
├── engine.test.ts           # 引擎测试
├── narrative-facts.test.ts # CRUD 测试
├── integration.test.ts       # 集成测试
└── mocks/
    └── memory-console.ts    # Mock 客户端
```

## 回退机制

当 Memory Console API 不可用时：

1. **assemble** 会捕获异常并返回空 facts
2. **compact** 委托给 legacy 引擎
3. 不影响核心会话功能

## License

MIT
