// TODO: Plug a real vision model. For now returns top N random-ish with a seeded score.
export async function identifySimilar(_image, keys, take = 5) {
function hash(s) {
let h = 0;
for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
return Math.abs(h);
}
const seed = Date.now() % 100000;
return keys
.map(k => ({
key: k,
score: ((hash((k.id + k.label) + seed.toString()) % 1000) / 1000).toFixed(2),
}))
.sort((a, b) => Number(b.score) - Number(a.score))
.slice(0, take);
}