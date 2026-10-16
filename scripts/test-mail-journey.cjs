const {mkdtempSync,rmSync}=require('node:fs');const {tmpdir}=require('node:os');const path=require('node:path');const {execFileSync,spawnSync}=require('node:child_process');
const directory=mkdtempSync(path.join(tmpdir(),'factory-mail-catcher-'));
try{
 const cert=path.join(directory,'cert.pem'),key=path.join(directory,'key.pem');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-days','1','-keyout',key,'-out',cert,'-subj','/CN=localhost','-addext','subjectAltName=DNS:localhost,IP:127.0.0.1'],{stdio:'ignore'});
 const result=spawnSync(process.execPath,[require.resolve('tsx/cli'),'--tsconfig','apps/web/tsconfig.json','scripts/mail-journey.mts',cert,key],{stdio:'inherit',env:{...process.env,NODE_EXTRA_CA_CERTS:cert}});
 process.exitCode=result.status??1;
}finally{rmSync(directory,{recursive:true,force:true})}
