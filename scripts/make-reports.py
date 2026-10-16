#!/usr/bin/env python3
"""Generate the three publication PDFs in public/reports/.
Self-contained minimal-PDF writer (no dependencies) so the build
stays reproducible. English-only text (standard PDF fonts do not
embed CJK glyphs)."""
import os

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'reports')
PAGE_W, PAGE_H = 612, 792  # US Letter points


def esc(s):
    return s.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')


class PDF:
    def __init__(self):
        self.objs = []  # list of (num, bytes)

    def add(self, num, data):
        self.objs.append((num, data))

    def build(self):
        out = bytearray(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
        offsets = {}
        for num, data in self.objs:
            offsets[num] = len(out)
            out += f'{num} 0 obj\n'.encode()
            out += data
            out += b'\nendobj\n'
        xref_pos = len(out)
        n = len(self.objs) + 1
        out += f'xref\n0 {n}\n'.encode()
        out += b'0000000000 65535 f \n'
        for num, _ in self.objs:
            out += f'{offsets[num]:010d} 00000 n \n'.encode()
        out += f'trailer\n<< /Size {n} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n'.encode()
        return bytes(out)


def text_block(pdf, num, lines):
    """lines: list of (x, y, text, size, font) where y measured from top."""
    ops = []
    for x, y, text, size, font in lines:
        ops.append(f'BT /{font} {size} Tf {x} {PAGE_H - y} Td ({esc(text)}) Tj ET')
    stream = '\n'.join(ops).encode('latin-1', 'replace')
    pdf.add(num, f'<< /Length {len(stream)} >>\nstream\n'.encode() + stream + b'\nendstream')


def make_report(filename, title, subtitle, body_lines, footer=None):
    pdf = PDF()
    pdf.add(1, b'<< /Type /Catalog /Pages 2 0 R >>')
    pdf.add(2, b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
    pdf.add(3, ('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] '
                '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>'
                % (PAGE_W, PAGE_H)).encode())
    pdf.add(5, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
    pdf.add(6, b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>')

    lines = []
    y = 64
    lines.append((54, y, 'FITNESS FOR THE ELDERLY  (LOK NENG KIN TAI)', 10, 'F1'))
    y += 14
    lines.append((54, y, 'Founded by students of Hong Kong International School  |  Hong Kong', 10, 'F1'))
    y += 16
    lines.append((54, y, 'Hotline: 2388 1234  |  WhatsApp: 6123 4567  |  info@ffe.org.hk', 9, 'F1'))
    y += 34
    lines.append((54, y, title, 22, 'F2'))
    y += 26
    lines.append((54, y, subtitle, 12, 'F1'))
    y += 30

    for text, size, bold, gap in body_lines:
        lines.append((54, y, text, size, 'F2' if bold else 'F1'))
        y += gap

    if footer:
        y += 18
        lines.append((54, y, footer, 9, 'F1'))

    text_block(pdf, 4, lines)
    with open(os.path.join(OUT, filename), 'wb') as f:
        f.write(pdf.build())
    print(f'wrote {filename} ({os.path.getsize(os.path.join(OUT, filename))} bytes)')


os.makedirs(OUT, exist_ok=True)

make_report(
    'organisation-overview.pdf',
    'Organisation Overview',
    'Who we are, why we exist, and where we are going',
    [
        ('About us', 13, True, 22),
        ('Fitness for the Elderly is a Hong Kong non-profit dedicated to improving the health and', 10.5, False, 15),
        ('happiness of residents aged 60+ through low-impact fitness, fall-prevention training and', 10.5, False, 14),
        ('social activities.', 10.5, False, 16),
        ('Our founders', 13, True, 20),
        ('-  Zi Chi  -  Co-founder, junior at Hong Kong International School', 10.5, False, 14),
        ('-  Daniel Chua  -  Co-founder, junior at Hong Kong International School', 10.5, False, 14),
        ('-  Adrian Preston Wong  -  Co-founder, junior at Hong Kong International School', 10.5, False, 16),
        ('Our mission', 13, True, 20),
        ('To help every older person live healthier, more independent and happier - through safe,', 10.5, False, 14),
        ('professional and enjoyable fitness.', 10.5, False, 16),
        ('Our vision', 13, True, 20),
        ('A Hong Kong where no senior suffers from loneliness or preventable falls.', 10.5, False, 16),
        ('Our network', 13, True, 20),
        ('Six district centers are planned: Sham Shui Po, Kwun Tong, Sha Tin, Tuen Mun, Central and', 10.5, False, 14),
        ('Tseung Kwan O - all near MTR stations with step-free access.', 10.5, False, 16),
        ('Join us', 13, True, 20),
        ('We are now recruiting our first members and volunteers. Membership is free for Hong Kong', 10.5, False, 14),
        ('residents aged 60+. Join us and become part of our founding community.', 10.5, False, 16),
    ],
    footer='This organisation is newly founded; we currently have no members. Figures published elsewhere on our site about Hong Kong seniors are third-party statistics with sources cited.',
)

make_report(
    'program-prospectus.pdf',
    'Program Prospectus',
    'Eight low-impact programs for seniors aged 60+',
    [
        ('Our programs', 13, True, 22),
        ('Every program is designed to be safe, enjoyable and suitable for different fitness levels.', 10.5, False, 15),
        ('Classes are free for members (HK$40 per class for non-members).', 10.5, False, 16),
        ('-  Fall-Prevention Balance Training', 10.5, True, 14),
        ('  Systematic balance and gait training designed to reduce the risk of falls.', 10.5, False, 14),
        ('-  Yang Style 24-Form Tai Chi', 10.5, True, 14),
        ('  Slow, ordered movements that train balance, breathing and focus.', 10.5, False, 14),
        ('-  Warm-Water Aqua Fitness', 10.5, True, 14),
        ('  Full-body exercise in a 32C pool - gentle on the joints.', 10.5, False, 14),
        ('-  Chair-Based Strength Training', 10.5, True, 14),
        ('  Build strength safely from a chair - ideal for limited mobility.', 10.5, False, 14),
        ('-  Stretch & Relax', 10.5, True, 14),
        ('  Improve flexibility and ease muscle tightness and stiff joints.', 10.5, False, 14),
        ('-  Walking Club', 10.5, True, 14),
        ('  Instructor-led group walks through district parks and promenades.', 10.5, False, 14),
        ('-  Brain Games Group', 10.5, True, 14),
        ('  Games and puzzles that train memory, attention and social connection.', 10.5, False, 14),
        ('-  Community Choir', 10.5, True, 14),
        ('  Sing golden oldies, train your lungs, and make new friends.', 10.5, False, 16),
        ('Health and safety', 13, True, 20),
        ('Our programs follow published physiotherapy and senior-fitness guidance, and will be led', 10.5, False, 14),
        ('by qualified instructors. First-time participants receive a simple health assessment.', 10.5, False, 16),
    ],
    footer='Health information is for reference only and does not replace professional medical advice.',
)

make_report(
    'first-year-plan.pdf',
    'First-Year Plan',
    'Our goals and roadmap for our first year of service',
    [
        ('Starting from zero', 13, True, 22),
        ('Fitness for the Elderly is newly founded. We currently have no members - this plan sets out', 10.5, False, 15),
        ('our honest, measurable goals for our first year.', 10.5, False, 16),
        ('Year-one goals', 13, True,20),
        ('-  Recruit 100 founding members', 10.5, False, 14),
        ('-  Hold 400 classes across our centers', 10.5, False, 14),
        ('-  Recruit 30 volunteers', 10.5, False, 14),
        ('-  Reduce fall risk by 20% for members completing the 12-week fall-prevention program', 10.5, False, 16),
        ('Roadmap', 13, True, 20),
        ('Months 1-3:   Finalise centers, recruit instructors and volunteers, launch membership', 10.5, False, 14),
        ('Months 4-6:   Open first classes (tai chi, chair strength, stretch & relax) in every district', 10.5, False, 14),
        ('Months 7-9:   Launch aqua fitness and fall-prevention cohorts; start community health days', 10.5, False, 14),
        ('Months 10-12: Review outcomes, publish our first annual report, and set year-two goals', 10.5, False, 16),
        ('How you can help', 13, True, 20),
        ('Become a founding member, volunteer your time, or donate - every contribution moves us', 10.5, False, 14),
        ('closer to a Hong Kong where no senior suffers from loneliness or preventable falls.', 10.5, False, 16),
    ],
    footer='Goals are targets, not results. We will report actual progress on our website as we go.',
)
print('done')
