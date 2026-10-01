#!/usr/bin/env python3
import argparse
from navegacao import render_all
ap=argparse.ArgumentParser(); ap.add_argument('job'); a=ap.parse_args(); render_all(a.job); print('Navegação atualizada')
