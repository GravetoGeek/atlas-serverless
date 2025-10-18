---
applyTo: '**'
---
Use estas diretrizes de projeto sempre que gerar código, responder perguntas ou revisar alterações.

> Toda comunicação deve ser feita em português brasileiro.
>Todo log, comentário e mensagem deve estar em português brasileiro
> Todo nome de variáveis, funções, classes e arquivos deve estar em inglês, seguindo as convenções da comunidade de desenvolvimento.

## Princípios de Arquitetura
- Busque baixo acoplamento: prefira interfaces explícitas e injeção de dependências em vez de singletons ou globais ocultos; evite imports com estado compartilhado entre pacotes.
- Mantenha as camadas centrais agnósticas a runtimes e infraestrutura. Comportamentos específicos de cloud ou stack devem viver atrás de adaptadores ou pacotes de providers.
- Envolva bibliotecas de terceiros em abstrações internas para que possamos trocá-las sem afetar a lógica de negócio.
- Evite dependências cíclicas entre pacotes; utilize pacotes utilitários ou contratos compartilhados para extrair funcionalidades comuns.
- Evite criar lógicas de compatibilidade retroativa ou "shims" para suportar múltiplas versões de bibliotecas; prefira manter dependências atualizadas e consistentes em todo o monorepo.
- Prefira refazer código legado em vez de adicionar complexidade para suportar múltiplas abordagens.
- Evite usar modeResolution "nodenext", prefira "node" para manter compatibilidade ampla com ferramentas e evitar problemas de resolução de módulos.

## Padrões Profissionais
- Adote as melhores práticas do mercado: TypeScript estrito, testes relevantes, tratamento defensivo de erros e documentação concisa para fluxos não triviais.
- Mantenha uma estrutura limpa e consistente. Módulos novos devem ter responsabilidade focada e seguir o layering existente (contracts, core, adapters, providers, applications, etc.).
- Escreva nomes expressivos, mantenha funções pequenas e exponha configurações via injeção de dependências ou parâmetros, evitando constantes codificadas.

## Agnosticidade de Cloud e Fornecedores
- Não codifique APIs ou SDKs específicos de vendor em pacotes compartilhados (por exemplo, `@packages/core-di`, `@packages/config`). Coloque a lógica específica em pacotes dedicados (como AWS) e exponha apenas interfaces genéricas.
- Ao adicionar novas capacidades, defina primeiro o contrato em `@packages/contracts` (ou módulo compartilhado adequado) antes de fornecer implementações específicas.
- Garanta que qualquer novo cloud provider possa ser habilitado apenas via configuração, sem alterar pacotes centrais; mantenha a seleção de providers declarativa.

## Bibliotecas de Terceiros
- Introduza bibliotecas externas somente quando necessário e isole-as em módulos de adapter/provider. Exponha interfaces definidas pelo projeto para que o restante da base dependa de abstrações controladas.
- Evite expor tipos específicos da biblioteca em contratos compartilhados; converta-os nas bordas.

## Expectativas de Entrega
- Documentação e comentários devem explicar apenas o que não for óbvio; prefira implementações autoexplicativas.
- Cada nova funcionalidade deve incluir testes adequados (unitários, integração ou contrato) e manter os scripts de build/teste passando.