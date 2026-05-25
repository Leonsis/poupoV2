# 📌 Fluxo de Trabalho do Projeto

Este documento descreve o **fluxo de trabalho padrão** que deve ser seguido por todos os colaboradores do projeto, garantindo organização, rastreabilidade e qualidade no versionamento do código.

---

## 🧭 Visão Geral

* O branch principal do projeto é o **`main`**
* Todo desenvolvimento deve ser feito **em branches separadas**
* As branches devem seguir um **padrão de nomenclatura**
* Commits devem ser **curtos, claros e objetivos**

---

## 🌱 Criação de Branch

Antes de iniciar qualquer alteração, o colaborador deve criar uma nova branch a partir da `main`.

### 📛 Padrão de nomenclatura da branch

```
{tipo}-{dia}{mes}-{nome-do-arquivo ou nomda da funcionalidade}
```

### 🔖 Tipos permitidos

* **add** → para novas funcionalidades
* **change** → para alterações/melhorias em código existente
* **fix** → para correções de bugs

### 📌 Exemplos

```
add-2601-login
change-1402-user-controller
fix-0303-auth-middleware
```

### 🚀 Comando para criar e trocar para a branch

```
git checkout -b add-2601-login
```

---

## ✍️ Desenvolvimento e Commit

Após realizar as alterações necessárias no código:

### 1️⃣ Adicionar arquivos alterados

```
git add .
```

### 2️⃣ Criar o commit

O commit deve conter uma mensagem **curta e objetiva**, explicando o objetivo da alteração.

```
git commit -m "Objetivo do código a ser incrementado de forma curta"
```

### ✅ Boas práticas para commits

* Use frases curtas
* Evite mensagens genéricas como `ajustes` ou `update`
* Seja claro sobre **o que foi feito**

---

## ⬆️ Envio da Branch para o Repositório Remoto

Após o commit, envie a branch para o repositório remoto:

```
git push origin {nome-da-branch}
```

### 📌 Exemplo

```
git push origin add-2601-login
```

---

## 🔁 Iniciando uma Nova Demanda

Sempre que o colaborador for iniciar uma **nova demanda**, ele deve primeiro garantir que a branch `main` esteja atualizada.

### 🔄 Passos obrigatórios

```
git checkout main
git pull origin main
```

Após isso, crie uma **nova branch** seguindo o padrão definido anteriormente.

---

## 🛑 Regras Importantes

* ❌ **Nunca desenvolver diretamente na `main`**
* ❌ **Nunca subir código sem commit**
* ❌ **O colaborador não deve realizar merge na `main`**
* ✅ **O merge das branches será feito exclusivamente pelo desenvolvedor responsável pelo projeto**
* ✅ Sempre manter a `main` atualizada antes de criar uma nova branch
* ✅ Seguir rigorosamente o padrão de nomenclatura

---

## 📣 Considerações Finais

Seguir este fluxo de trabalho garante:

* Organização do projeto
* Facilidade de revisão de código
* Histórico de alterações mais claro
* Menos conflitos entre branches

Em caso de dúvidas, alinhe com o responsável técnico do projeto antes de prosseguir 🚀
