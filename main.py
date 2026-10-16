"""Generate a QR code locally: python main.py 'https://example.com' -o code.svg."""
import argparse
from pathlib import Path
import sys

import qrcode
from qrcode.exceptions import DataOverflowError
from qrcode.image.svg import SvgPathImage


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('content', nargs='?', help='Text or URL; reads standard input when omitted')
    parser.add_argument('-o', '--output', type=Path, default=Path('qrcode.png'), help='Output .png or .svg path')
    parser.add_argument('--scale', type=int, default=12, help='Pixels per module for PNG (1–100)')
    parser.add_argument('--correction', choices=['M', 'Q', 'H'], default='M')
    parser.add_argument('--force', action='store_true', help='Allow replacing an existing output')
    args = parser.parse_args()
    content = args.content if args.content is not None else sys.stdin.read().rstrip('\n')
    if not content.strip():
        parser.error('Content must not be empty.')
    if args.output.suffix.lower() not in {'.png', '.svg'}:
        parser.error('Choose an output filename ending in .png or .svg.')
    if not 1 <= args.scale <= 100:
        parser.error('--scale must be between 1 and 100.')
    qr = qrcode.QRCode(error_correction=getattr(qrcode.constants, f'ERROR_CORRECT_{args.correction}'), box_size=args.scale, border=4)
    try:
        qr.add_data(content)
        qr.make(fit=True)
        image = qr.make_image(image_factory=SvgPathImage) if args.output.suffix.lower() == '.svg' else qr.make_image(fill_color='black', back_color='white')
        with args.output.open('wb' if args.force else 'xb') as output:
            image.save(output)
    except DataOverflowError:
        parser.error('Content is too long for a QR code; shorten it or lower error correction.')
    except FileExistsError:
        parser.error('Output already exists. Choose a different path or pass --force.')
    except OSError as error:
        parser.error(f'Could not write output: {error}')
    print(f'Saved {args.output}')


if __name__ == '__main__':
    main()
