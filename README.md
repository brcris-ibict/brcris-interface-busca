# Interface de Busca do BrCris

Uma interface de busca para o Ecossistema de Informação da Pesquisa Científica Brasileira (BrCris), construída com Next.js para proporcionar uma experiência rápida, responsiva e intuitiva na pesquisa de informações científicas no Brasil.

## 📝 Sobre o Projeto

A Interface de Busca do BrCris é uma aplicação web desenvolvida em Next.js com o objetivo de facilitar o acesso e a análise de dados da pesquisa científica brasileira. A interface permite realizar buscas e filtrar informações de forma eficiente, contribuindo para o acesso e a disseminação de conhecimento científico.

O BrCris (Ecossistema de Informação da Pesquisa Científica Brasileira) é uma plataforma agregadora que permite recuperar, certificar e visualizar dados e informações relativas aos diversos atores que atuam na pesquisa científica no contexto brasileiro.

## 🚀 Tecnologias Utilizadas

- Next.js: Framework React para desenvolvimento de aplicações web rápidas e escaláveis.
- React: Biblioteca JavaScript para construção de interfaces de usuário.
- @elastic/react-search-ui: Biblioteca de UI para implementar buscas avançadas usando Elasticsearch.
- @elastic/search-ui-elasticsearch-connector: Conector para integrar o Search UI ao Elasticsearch, permitindo buscas rápidas e personalizáveis.

## 📦 Instalação e Configuração

Pré-requisitos
Certifique-se de ter o Node.js e o npm instalados em sua máquina.

Clone o repositório:

```bash
git clone https://github.com/projetos-codic-ibict/brcris-interface-busca.git
```

Instale as dependências:

```bash
cd brcris-interface-busca
npm ci
```

Crie um arquivo .env na raiz do projeto e configure as variáveis de ambiente necessárias de acordo com o .env.example.

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse o projeto em http://localhost:3000.

## 🔍 Uso

Insira um termo de pesquisa na barra de busca para iniciar uma consulta no sistema do BrCris.
Utilize filtros e opções avançadas para refinar os resultados.
Clique em um resultado para ver mais detalhes sobre a pesquisa.

## 📁 Estrutura do Projeto

```plaintext
.
├── components      # Componentes reutilizáveis da interface
├── pages           # Páginas da aplicação (estrutura de rotas do Next.js)
├── public          # Arquivos públicos (imagens, fontes, etc.)
├── styles          # Estilos globais e tema
├── utils           # Utilitários e helpers
├── .env.local      # Arquivo de configuração de variáveis de ambiente
└── README.md       # Documentação do projeto
```

## 📄 Licença

Este projeto é licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
