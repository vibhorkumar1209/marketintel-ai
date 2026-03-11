const fs = require('fs');
const Redis = require('ioredis');

const envLocal = fs.readFileSync('.env.local', 'utf8');
let redisUrl = '';
for (const line of envLocal.split('\n')) {
    if (line.startsWith('REDIS_URL=')) {
        redisUrl = line.split('=')[1].replace(/"/g, '');
    }
}

if (!redisUrl) {
    console.error("No REDIS_URL in .env.local");
    process.exit(1);
}

const redis = new Redis(redisUrl);
redis.del('report:cmmjb37ad0005ouuk7bkxdd1z').then(() => {
    console.log('Cleared redis cache for report');
    return redis.quit();
}).catch(console.error);
