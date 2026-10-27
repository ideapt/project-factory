"""루프백 주소에서만 미리보기를 열고 OCR 작업자 실행을 지원합니다."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
import webbrowser
root=Path(__file__).resolve().parent.parent
try:
    server=ThreadingHTTPServer(('127.0.0.1',8870),partial(SimpleHTTPRequestHandler,directory=str(root)))
except OSError:
    print('8870 포트를 사용할 수 없습니다. 기존 미리보기 창을 닫고 다시 실행하세요.')
    raise SystemExit(1)
webbrowser.open('http://127.0.0.1:8870/prototype/')
print('미리보기 실행 중. 종료하려면 이 창에서 Ctrl+C를 누르세요.')
try: server.serve_forever()
except KeyboardInterrupt: pass
finally: server.server_close()
