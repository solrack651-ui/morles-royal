# Morles Royal

Demo web3 para skins/armas con compra automática y personaje 3D.

## Requisitos
- Node.js 18+
- npm
- BSC Testnet
- MetaMask o SafePal

## Instalación
```bash
npm install
cp .env.example .env
```

## Configuración
Rellena:
- `PRIVATE_KEY`
- `VITE_WC_PROJECT_ID`

## Contrato
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network bscTestnet
```

## Frontend
```bash
npm run dev
```

## Backend
```bash
npm run server
```

## Importante
- Poner la dirección del contrato desplegado en `src/constants.js`
- Si MORLES no existe en testnet, usa un mock de token.
