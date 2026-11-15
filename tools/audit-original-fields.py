"""Check the recovered field fix against a separately supplied research JAR.

Reads only; never packages the input or extracts executable files into the repo.
"""
from pathlib import Path
import argparse,hashlib,json,struct,zipfile
p=argparse.ArgumentParser();p.add_argument('jar',type=Path);p.add_argument('--out',type=Path);a=p.parse_args()
jar=a.jar.read_bytes()
assert hashlib.sha256(jar).hexdigest()=='aeadd87840c7b3f1f06548489406dbc0bf833b41de9cdfa3eaf741e832a213c2'
with zipfile.ZipFile(a.jar) as z:
    native=z.read('client.bin1108');palette=z.read('color.ncj')
    inventory=[{'name':i.filename,'bytes':i.file_size,'sha256':hashlib.sha256(z.read(i)).hexdigest()} for i in z.infolist() if not i.is_dir()]
assert hashlib.sha256(native).hexdigest()=='782b2c836ef32331e74a943367aa7bae09891fa56ca39cd89acfa887bcfa55d3'
word=lambda offset:struct.unpack_from('<I',native,offset)[0]
base=0x70260
tokens={name:word(base+slot) for name,slot in [('ordinary_l_read',0x30c),('ordinary_l_write',0x310),('ordinary_a_write',0x318),('ordinary_i_read',0x31c),('ordinary_small_write',0x320),('alternate_l_read',0x3b4),('alternate_l_write',0x3b8),('alternate_a_write',0x3c0),('alternate_i_read',0x3c4),('alternate_small_write',0x3c8)]}
assert tokens['ordinary_l_read']==tokens['ordinary_l_write']==tokens['alternate_l_read']==tokens['alternate_l_write']==0x012c00a7
assert tokens['ordinary_small_write']==tokens['alternate_small_write']==0x012c0095
assert tokens['ordinary_a_write']==tokens['alternate_a_write']==0x012c0091
assert tokens['ordinary_i_read']==tokens['alternate_i_read']==0x012c00a1
assert native[0x42896:0x42898]==bytes.fromhex('0322') # Thumb movs r2,#3
assert native[0x434be:0x434c0]==bytes.fromhex('0322')
assert native[0x56f22:0x56f24]==bytes.fromhex('0021') # Thumb movs r1,#0
idle_literal=word(((0x56f20+4)&~3)+0x164)
idle_slot=0x80260+struct.unpack('<i',struct.pack('<I',idle_literal))[0]
assert word(idle_slot)==0x015f031d # The same u.Y member as the defeated-boss state write.
assert len(palette)==100*141
source=(Path(__file__).resolve().parents[1]/'web/src/native-palette.js').read_text()
rows=json.JSONDecoder().raw_decode(source.split('const rows=',1)[1])[0]
assert len(rows)==100
for index,row in enumerate(rows):
    record=palette[index*141:(index+1)*141]
    assert row['colors']==['#'+record[i*7:i*7+3].hex() for i in range(16)]
    assert row['pattern']==list(record[112:128])
report={'sourcePage':'https://dubigame.tistory.com/16','jarSha256':hashlib.sha256(jar).hexdigest(),'nativeSha256':hashlib.sha256(native).hexdigest(),'fieldTableBase':hex(base),'tokens':{k:hex(v) for k,v in tokens.items()},'correction':'ordinary reflected size-one cells write y.c=3, retaining y.l=15 (or 23 for variant 3); R86 incorrectly wrote y.l=3','idleRecovery':{'entry':'0x55c62','zeroTimerBranch':'0x56f20','stateFieldToken':'0x015f031d','stateValue':0,'continuation':'0x55c8a','correction':'Clear Y when entering with H<=0; otherwise bosses 7 and 9 stay in hit-recovery forever'},'palette':{'records':100,'stride':141,'sha256':hashlib.sha256(palette).hexdigest()},'inventory':inventory,'scope':'Same unauthenticated KTF candidate as prior functional extraction; downloaded independently from a third-party archive. Does not authenticate an official release or establish complete original equivalence. Input game files and original recordings are not distributed.'}
if a.out:a.out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['jarSha256','tokens','correction','palette']},ensure_ascii=False))
