import CultStream from './CultStream/CultStream';

// === ARKAPLAN HAVUZU ===
const backgroundPool = [
  { id: 'cult-stream', name: 'Cult Stream', component: CultStream },
];

export function getRandomBackground() {
  if (backgroundPool.length === 0) {
    return { id: 'none', name: 'None', component: () => null };
  }
  const index = Math.floor(Math.random() * backgroundPool.length);
  return backgroundPool[index];
}

export default backgroundPool;
