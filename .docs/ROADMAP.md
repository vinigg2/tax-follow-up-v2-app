# Roadmap de Desenvolvimento

## Fases Concluidas

### Fase 1: Infraestrutura Base
- [x] Setup do projeto Laravel + React
- [x] Configuracao TypeScript
- [x] Integracao Tailwind CSS
- [x] Componentes Shadcn/ui
- [x] Layout base (Sidebar, Header)
- [x] Tema dark/light mode

### Fase 2: Modulos CRUD Basicos
- [x] Sistema de Times
- [x] Sistema de Empresas
- [x] Sistema de Usuarios (com CPF)
- [x] Estados vazios com ilustracoes
- [x] Paginas de erro (404, 500)

### Fase 3: Sistema de Obrigacoes
- [x] API e tipos de obrigacoes
- [x] Hooks React Query
- [x] Modal de criacao/edicao
- [x] Preview de competencia e prazo
- [x] Vinculo com empresas
- [x] Geracao automatica de tarefas
- [x] Listagem com filtros

### Fase 4: Sistema de Checklist
- [x] API e tipos de checklist
- [x] Hooks React Query
- [x] Componente ChecklistManager
- [x] 5 status (pendente, em_andamento, concluido, cancelado, bloqueado)
- [x] CRUD de itens
- [x] Integracao no TaskActionsDrawer
- [x] Barra de progresso
- [x] Visualizacao em fluxograma (aba Processo)

## Proximas Fases

### Fase 5: Campos Dinamicos (Pendente)
- [ ] API e tipos de campos dinamicos
- [ ] Hooks React Query
- [ ] Componente DynamicFieldsManager
- [ ] Tipos de campo: texto, numero, data, select, checkbox
- [ ] Valores por tarefa
- [ ] Integracao na aba "Outras Info"

### Fase 6: Atividades e Comentarios (Pendente)
- [ ] API de atividades
- [ ] Registro automatico de acoes
- [ ] Sistema de comentarios
- [ ] Mencoes de usuarios
- [ ] Notificacoes

### Fase 7: Dashboard (Pendente)
- [ ] Widgets de resumo
- [ ] Graficos de progresso
- [ ] Tarefas atrasadas
- [ ] Proximos vencimentos
- [ ] Performance por time/usuario

### Fase 8: Relatorios (Pendente)
- [ ] Relatorio de tarefas por periodo
- [ ] Relatorio de obrigacoes
- [ ] Exportacao PDF/Excel
- [ ] Agendamento de relatorios

## Melhorias Tecnicas Planejadas

### Performance
- [ ] Virtualizacao de listas longas
- [ ] Lazy loading de componentes
- [ ] Otimizacao de re-renders

### UX
- [ ] Drag and drop no checklist
- [ ] Atalhos de teclado
- [ ] Busca global
- [ ] Tour de onboarding

### Infraestrutura
- [ ] Testes unitarios (Vitest)
- [ ] Testes E2E (Playwright)
- [ ] CI/CD pipeline
- [ ] Documentacao API (Swagger)
