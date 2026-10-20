"""Rebuild the original MIT-licensed sample: uv run --with reportlab python scripts/create-demo.py."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit

OUT = Path(__file__).resolve().parents[1] / 'assets' / 'sample.pdf'
W,H=581,751
INK=HexColor('#284f40'); PAPER=HexColor('#f7f4e9'); SAGE=HexColor('#b4c49c'); MUTED=HexColor('#697461')
c=canvas.Canvas(str(OUT),pagesize=(W,H),invariant=1)
c.setTitle('The art of turning pages');c.setAuthor('flipbook contributors');c.setSubject('Original sample document, MIT licensed')
themes=[
 ('A quieter reading room','Let the document lead. A small toolbar leaves room for photographs, illustrations and words. Open your own PDF with the upload icon; the file stays in your browser.','Reading should feel like opening something, rather than operating something. This sample brings together original words and simple geometric artwork to help you explore flipbook.'),
 ('A page has two sides','Turn a corner and watch the next spread emerge. The fold is animated, while the paper edges reveal how far you have travelled through the document.','Use the arrows or your keyboard to move through the book. On desktop, drag an outer corner. The page-turn sound is synthesized in your browser and can be muted at any time.'),
 ('Follow the paper trail','The paper stacks are more than decoration. Move across their thickness to preview a destination number, then click to jump directly to that spread.','The left stack holds earlier sheets. The right stack holds those still to come. Keyboard users can focus a stack with Tab, adjust the destination with arrow keys and press Enter.'),
 ('Words you can keep','The words on this page are real PDF text. Select a sentence and copy it. You do not need to switch into a separate mode to work with the passage in front of you.','Image-only scans are different: a picture of a word is not a text character. Those documents need optical character recognition before selection or full-text search can work.'),
 ('Find a familiar phrase','Search for paper, reading or geometric to explore the text search. Results include a short excerpt and a destination, so you can move from an idea to its context.','The thumbnail panel shows facing sheets together. Only their numbers appear beneath the previews. The active spread is marked with a subtle outline.'),
 ('Leave a thought behind','Notes attach to your current position. Add a question, record an observation or bookmark a spread you want to revisit. Your saved reading data belongs to this browser.','There is no account and no cloud synchronization. Clearing browser storage removes local notes and bookmarks. Keep a separate copy of anything important.'),
 ('A closer look','Zoom in when the small details matter. The enlarged view keeps selectable text and supports external links embedded in a PDF. Scroll to explore, then press Escape to return.','A clear typeface and generous spacing make a document easier to read at any size. These pages use the standard fonts built into the PDF format, keeping the sample small and portable.'),
 ('From here to elsewhere','A link can preserve a spread number for a document hosted at a stable address. Your own temporary local file does not become public merely because the viewer can display it.','The download control saves the original document. Printing opens the PDF in your browser viewer, where the browser provides the print dialog and printer selection.'),
 ('Small shapes, many rhythms','Every illustration in this sample is composed of circles, rectangles and lines. Repetition creates a rhythm; an offset introduces movement.','The drawings are deliberately simple. They provide large shapes for testing page folds, fine lines for checking zoom and calm spaces beside the text.'),
 ('Made to be opened','flipbook is an independent open source viewer built with React, PDF.js and StPageFlip. It can run on a static host after a production build.','The code, original logo and this sample are MIT licensed. Third-party libraries retain their own licenses. Bring documents that you have permission to use.'),
 ('Room for the next chapter','A publishing platform needs more than a reader: durable hosting, access controls, content management and perhaps shared annotations. This release focuses on the reading experience.','Try the viewer with your own documents. Check portrait pages, landscape pages, long publications and image-heavy files. Reproducible examples help make the reader better.'),
]
def label(text,y=H-42):
 c.setFillColor(MUTED);c.setFont('Helvetica',8);c.drawString(38,y,text.upper())
def footer(n):
 c.setStrokeColor(HexColor('#d7dccf'));c.setLineWidth(.5);c.line(38,35,W-38,35)
 c.setFont('Helvetica',8);c.setFillColor(MUTED);c.drawString(38,22,'FLIPBOOK / ORIGINAL SAMPLE');c.drawRightString(W-38,22,str(n))
def para(text,x,y,width,font='Times-Roman',size=13,leading=19):
 c.setFillColor(INK);c.setFont(font,size)
 for line in simpleSplit(text,font,size,width):c.drawString(x,y,line);y-=leading
 return y
for n in range(1,25):
 c.setFillColor(PAPER);c.rect(0,0,W,H,fill=1,stroke=0)
 if n==1:
  c.setFillColor(INK);c.rect(0,0,W,H,fill=1,stroke=0);c.setFillColor(PAPER);c.setFont('Helvetica',12);c.drawString(42,H-54,'flipbook / the original edition')
  c.setFont('Times-Roman',64)
  for j,line in enumerate(['The art of','turning','pages.']):c.drawString(40,H-180-j*68,line)
  c.setFillColor(SAGE)
  c.setStrokeColor(SAGE);c.setLineWidth(2)
  for k in range(10):c.bezier(44,85+k*12,240,200+k*9,320,35+k*12,535,155+k*12)
  c.setFillColor(PAPER);c.setFont('Helvetica',9);c.drawString(43,38,'AN OPEN SOURCE READING ROOM / 24 PAGES')
 elif n==24:
  label('Until the next page');c.setFont('Times-Roman',49);c.setFillColor(INK);c.drawString(42,540,'Make room');c.drawString(42,483,'for a good read.')
  para('Open a PDF. Turn a page. Stay a while.',43,410,470,size=16)
  c.setFillColor(SAGE);c.circle(440,180,120,fill=1,stroke=0);c.setFillColor(INK);c.setFont('Helvetica-Bold',26);c.drawString(42,100,'flipbook')
  footer(n)
 else:
  i=(n-2)//2;title,a,b=themes[i];label(f'{i+1:02d} / {title}')
  if n%2==0:
   y=H-115
   for line in simpleSplit(title,'Times-Roman',38,W-76):c.setFillColor(INK);c.setFont('Times-Roman',38);c.drawString(38,y,line);y-=43
   y=para(a,40,y-25,W-80);para(b,40,y-24,W-80)
   c.setFillColor(SAGE);c.rect(40,80,80,12,fill=1,stroke=0);footer(n)
  else:
   c.setFillColor(HexColor(['#dde2d2','#d8dccc','#e6d6bb','#d2ddd6'][i%4]));c.rect(38,150,W-76,520,fill=1,stroke=0)
   c.saveState();p=c.beginPath();p.rect(38,150,W-76,520);c.clipPath(p,stroke=0)
   c.setStrokeColor(INK);c.setLineWidth(1.5)
   for k in range(18):
    if i%3==0:c.circle(W/2,410,25+k*15,fill=0,stroke=1)
    elif i%3==1:c.line(20,180+k*27,560,640-k*13)
    else:c.roundRect(65+k*10,180+k*15,390-k*15,400-k*11,8,fill=0,stroke=1)
   c.restoreState();label(f'Geometric study {i+1:02d}',112);footer(n)
 c.showPage()
c.save()
print(OUT)
