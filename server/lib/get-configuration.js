import fs   from 'fs'
import yml  from 'js-yaml'
import path from 'path'

export default () => {
    try {
        const customPath = path.join(__dirname, '../../config.yml');
        const raw        = fs.readFileSync(customPath, { encoding: 'utf-8' })
        const file       = yml.load(raw);
        return file;
    } catch (error) {
        return false;
    }
}