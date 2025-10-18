# Serverless Template Monorepo

Template moderno para desenvolvimento, testes e deploy de aplicações serverless em TypeScript, com suporte a AWS Lambda, LocalStack, TurboRepo, DI, logging e integração contínua.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Como Rodar Localmente](#como-rodar-localmente)
- [Testes Automatizados](#testes-automatizados)
- [Integração com LocalStack](#integração-com-localstack)
- [Deploy e Produção](#deploy-e-produção)
- [Boas Práticas](#boas-práticas)
- [Referências](#referências)

---

## Visão Geral

Este projeto é um monorepo serverless em TypeScript, preparado para desenvolvimento local, testes automatizados e deploy em ambientes AWS. Utiliza TurboRepo para orquestração, LocalStack para simulação de serviços AWS, e segue padrões de modularização, injeção de dependências e logging corporativo.

---

## Estrutura do Projeto

```
serverless_template/
├── lambdas/
│   └── example-lambda/
│       ├── src/
│       │   └── index.ts
│       ├── index.test.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── config/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   └── index.integration.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── core-di/
│   └── logger/
├── server.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── .env.local
├── .env.production
└── README.md
```

---

## Pré-requisitos

- Node.js >= 18.x
- Docker e Docker Compose
- AWS CLI (para manipular LocalStack)
- TurboRepo (`npm install -g turbo`)
- LocalStack (`docker pull localstack/localstack`)
- (Opcional) Python 3.x para AWS CLI

---

## Configuração de Ambiente

1. **Variáveis de ambiente:**  
   Copie `.env.example` para `.env.local` e ajuste conforme necessário.

2. **Arquivos `.env`:**  
   - `.env.local` para desenvolvimento local
   - `.env.production` para produção
   - `.env.test` para testes automatizados

3. **Seleção de providers:**  
   Defina `PROVIDERS_ENABLED` (ou `APP_PROVIDERS`) com a lista de providers habilitados, separados por vírgula. Exemplo para habilitar apenas AWS/LocalStack:
   ````
   PROVIDERS_ENABLED=aws
   ````

4. **Credenciais AWS/LocalStack:**  
   Quando `aws` estiver habilitado, informe também as credenciais:
   ```
   CLOUD_ACCESS_KEY_ID=test
   CLOUD_SECRET_ACCESS_KEY=test
   CLOUD_REGION=sa-east-1
   CLOUD_ENDPOINT_URL=http://localhost:4566
   ```

---

## Como Rodar Localmente

1. **Suba o ambiente com Docker Compose:**
   ```bash
   docker compose --env-file .env.local up --build
   ```

2. **Acesse o servidor Express:**
   ```
   http://localhost:3000
   ```

3. **Manipule parâmetros SSM no LocalStack:**
   ```bash
   aws --endpoint-url=http://localhost:4566 ssm put-parameter --name NOME_DO_SECRET_REAL --value "valor_secreto" --type SecureString
   ```

### Habilitando múltiplos providers

- Adicione os providers desejados em `PROVIDERS_ENABLED`. Exemplo para habilitar AWS e um provider customizado chamado `observability`:
   ````
   PROVIDERS_ENABLED=aws,observability
   ````
- Cada provider deve possuir uma implementação de registro no pacote correspondente (ex.: `@packages/infrastructure-aws` para AWS) e ser mapeado em `packages/applications/src/runtimeEnvironment.ts`.
- Caso um provider seja listado sem configuração obrigatória, a aplicação falhará durante o bootstrap, facilitando diagnósticos precoces.

---

## Testes Automatizados

- **Unitários:**  
  Execute com:
  ```bash
  npm run vitest
  ```
  ou dentro do container:
  ```bash
  docker compose exec monorepo npm run vitest
  ```

- **Integração com LocalStack:**  
  Os testes de integração garantem que funções buscam secrets reais no SSM simulado.

---

## Integração com LocalStack

- O serviço LocalStack é configurado no `docker-compose.yml` e simula AWS SSM.
- Parâmetros devem ser criados manualmente via AWS CLI apontando para o endpoint do LocalStack.
- O client AWS é configurado para alternar entre AWS real e LocalStack via variáveis de ambiente.

---

## Deploy e Produção

- Para produção, remova ou comente `CLOUD_ENDPOINT_URL` e use credenciais reais.
- O projeto está preparado para deploy em AWS Lambda, podendo ser adaptado para pipelines CI/CD (ex: GitHub Actions, AWS CodePipeline).

### CI/CD com GitHub Actions

- `ci.yml` executa lint, testes e build em cada `push` ou `pull request`, garantindo que os pacotes continuem íntegros.
- `deploy.yml` resolve parâmetros dinamicamente (inputs, variáveis ou secrets) e publica a Lambda via AWS CLI. Ele foi projetado para aceitar facilmente outros providers adicionando novos blocos condicionais.
- O script `scripts/package-lambda.sh` empacota qualquer workspace de Lambda em um artefato `.zip` reusável por pipelines ou execução local.
- O script `scripts/deploy-aws-lambda.sh` utiliza o pacote gerado para atualizar a função AWS, sendo o ponto de extensão natural para outros provedores.

### Configuração exigida para o deploy automatizado

- Defina `AWS_REGION` e `AWS_LAMBDA_FUNCTION_NAME` como _secrets_ ou variáveis em `Settings → Secrets and variables → Actions`.
- Autenticação:
   - preferencialmente, forneça `AWS_ROLE_TO_ASSUME` (ARN de role com `sts:AssumeRole`) para usar OIDC; ou
   - configure `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` com permissões de `lambda:UpdateFunctionCode`.
- Ajuste as variáveis opcionais `CLOUD_PROVIDER`, `LAMBDA_WORKSPACE` e `PUBLISH_RELEASE` para personalizar ambientes sem alterar código.
- Para rodadas manuais (`workflow_dispatch`), é possível informar `cloud_provider`, `lambda_workspace`, `lambda_function_name`, `aws_region` e `publish_release` diretamente na interface do GitHub.

### Adaptando para outros provedores

- Crie scripts específicos em `scripts/` para o novo provider reutilizando a saída do `package-lambda.sh`.
- Adicione um bloco condicionado no `deploy.yml` validando `provider` e disparando o script recém-criado.
- Mantenha os contratos em `@packages/contracts` atualizados e encapsule SDKs específicos em pacotes dedicados dentro de `packages/providers-*`.

---

## Boas Práticas

- **Valide todas as variáveis de ambiente com Zod.**
- **Centralize configuração e secrets no pacote `config`.**
- **Utilize DI para desacoplar dependências.**
- **Instancie registries via fábricas (`createLocalHandlerRegistry`, `createAwsHandlerRegistry`) para manter o runtime sem singletons.**
- **Controle providers ativos apenas por configuração (`PROVIDERS_ENABLED`), evitando mudanças de código ao habilitar novos vendors.**
- **Padronize logs com o pacote `logger`.**
- **Documente e mantenha exemplos de uso e testes.**
- **Automatize a criação de parâmetros de teste no LocalStack.**
- **Utilize arquivos `.env` específicos para cada ambiente.**

---

## Referências

- [TurboRepo](https://turbo.build/)
- [LocalStack](https://localstack.cloud/)
- [AWS SDK v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [Vitest](https://vitest.dev/)
- [Zod](https://zod.dev/)
- [Winston Logger](https://github.com/winstonjs/winston)

---

Se quiser personalizar ainda mais o README para seu time ou adicionar exemplos de código, posso ajudar!
