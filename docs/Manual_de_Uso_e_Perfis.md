# Manual de uso e perfis de acesso

> Equipe de Tecnologia e Infraestrutura  
> Atualizado em agosto de 2026  

## Acesso em rede e execução

O painel roda como serviço web na rede interna e pode ser acessado pelo navegador sem necessidade de instalar aplicativos nas estações.

### Endereços de acesso
- Neste computador (servidor): `http://localhost/`
- Na rede corporativa: `http://10.1.159.240/`
- Porta padrão: 80 (HTTP)

### Unidades atendidas
1. Unidade São Francisco: impressoras do subsolo, térreo e andares 1 a 4 (rede `10.1.152.x`).
2. Unidade Rio Sul: consultórios e atendimento no 13º andar (rede `10.5.104.x`).
3. Unidade Havaí: consultórios e procedimentos no térreo e 1º andar (rede `10.1.176.x`).
4. Sede Leblon: impressoras corporativas no 7º andar (rede `10.5.16.x`).

### Inicialização do serviço
Para iniciar o servidor, execute o arquivo `INICIAR_PAINEL.bat` na raiz da pasta do projeto.

## Perfis de usuário

O sistema possui dois níveis de acesso:

```
                  ┌─────────────────────────────────────┐
                  │           TELA INICIAL              │
                  └──────────────┬──────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
    ┌──────────────────────────┐    ┌──────────────────────────┐
    │     OPERADOR LOCAL       │    │      ADMINISTRADOR       │
    │  (Seleção da filial)     │    │    (Usuário e senha)     │
    └────────────┬─────────────┘    └────────────┬─────────────┘
                 ▼                               ▼
    • Visão restrita à filial       • Visão de todas as filiais
    • Modo leitura                  • Cadastro, edição e exclusão
    • Status e fila de atenção      • Teste de conectividade por IP
    • Detalhes da impressora        • Volume, previsão e histórico
                                    • Exportação de dados em CSV
```

## Perfil: Operador de unidade

Indicado para recepcionistas, assistentes administrativos e técnicos locais:
- Login: seleção direta da filial no formulário inicial.
- Escopo: exibe apenas os equipamentos da unidade escolhida.
- Modo leitura: formulários de edição, exclusão e ferramentas de teste não aparecem para este perfil.

### Recursos disponíveis ao operador
1. Painel de status: contagem de impressoras em estado normal, em atenção (10% a 30%), críticas (<10%) e sem comunicação.
2. Fila de atenção: lista ordenada com os suprimentos mais próximos do término e orientação de troca.
3. Lista de impressoras:
   - Identificação do setor e localização física.
   - Modelo identificado e endereço IP.
   - Barra visual de nível do suprimento principal.
   - Detalhes (Raio-X): gaveta lateral com todos os consumíveis (CMYK), bandejas e contadores.
   - Atualização sob demanda: botão para disparar leitura imediata via rede.
4. Troca de tema: alternância entre os modos escuro e claro.

## Perfil: Administrador de TI

Indicado para a equipe de infraestrutura e suporte:
- Login: requer autenticação com usuário e senha.
- Usuário padrão: `admin`
- Senha padrão: `admin`

### Recursos exclusivos do administrador
1. Visão geral: acompanhamento simultâneo de todas as unidades com filtro rápido por filial.
2. Gerenciamento de pastas: criação e remoção de unidades no sistema.
3. Cadastro de impressoras: inclusão de novos equipamentos informando filial, setor e endereço IP.
4. Edição e exclusão: alteração de parâmetros cadastrais ou remoção de máquinas do parque.
5. Diagnóstico de IP: teste direto de portas SNMP (UDP 161) e HTTP (TCP 80) para equipamentos ainda não cadastrados.
6. Módulo de volume e previsão: dados de consumo diário, semanal e mensal, taxa de uso e projeção de término dos suprimentos.
7. Auditoria de recargas: histórico de trocas de cartuchos com registro manual e cálculo de páginas do ciclo.
8. Exportação: download de planilhas formatadas em CSV (UTF-8 BOM).

## Padrão de identificação visual

- Título principal no cartão: setor ou sala onde o equipamento está instalado (ex: Recepção, Consultório 3).
- Linha secundária: modelo do equipamento e endereço IP na rede interna.
- Dados complementares: número de série, contadores e suprimentos secundários exibidos no painel de detalhes.
