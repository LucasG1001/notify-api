"""
Exemplo: enviar um aviso estilizado no Telegram
- Imagem no topo
- Texto formatado (negrito, itálico, spoiler, link)
- Botões clicáveis (inline keyboard)

Requisitos:
    pip install requests

Como obter o necessário:
    1. Fale com @BotFather no Telegram -> /newbot -> pegue o TOKEN
    2. Adicione o bot como ADMIN no seu canal de avisos
    3. CHAT_ID do canal: use "@nome_do_canal" (canal publico)
       ou o id numerico (ex: -1001234567890) para canal privado
"""

import requests

TOKEN = "8681672789:AAFllX8tRnym3VxIA_iAM1zabIv999OOxok"
CHAT_ID = "-1004290285771"   # ou -100xxxxxxxxxx

API = f"https://api.telegram.org/bot{TOKEN}"


def enviar_aviso():
    # Texto da legenda (caption) - suporta HTML
    legenda = (
        "🎬 <b>[NOVO] Trailer de Dune: Parte 3</b>\n\n"
        "Saiu agora o primeiro teaser oficial 🏜️\n"
        "<i>Estreia: dezembro de 2026</i>\n\n"
        "<b>Vaza spoiler?</b> <span class='tg-spoiler'>Paul retorna em Arrakis</span>\n\n"
        "🔗 <a href='https://exemplo.com/trailer'>Fonte oficial</a>"
    )

    # Botoes clicaveis abaixo da imagem
    teclado = {
        "inline_keyboard": [
            [
                {"text": "🎥 Ver trailer", "url": "https://youtube.com/..."},
                {"text": "💬 Discord", "url": "https://discord.gg/seuservidor"},
            ],
            [
                {"text": "📅 Lembrete da estreia", "url": "https://exemplo.com/lembrete"}
            ],
        ]
    }

    payload = {
        "chat_id": CHAT_ID,
        "photo": "https://picsum.photos/800/450",  # URL ou file_id
        "caption": legenda,
        "parse_mode": "HTML",            # use "MarkdownV2" se preferir markdown
        "reply_markup": teclado,
    }

    r = requests.post(f"{API}/sendPhoto", json=payload)
    print(r.status_code, r.json())


def enviar_album():
    """Varias imagens de uma vez (album). Album NAO aceita botoes."""
    midia = [
        {
            "type": "photo",
            "media": "https://exemplo.com/img1.jpg",
            "caption": "📸 <b>Galeria de fotos do set</b>",
            "parse_mode": "HTML",
        },
        {"type": "photo", "media": "https://exemplo.com/img2.jpg"},
        {"type": "photo", "media": "https://exemplo.com/img3.jpg"},
    ]
    r = requests.post(
        f"{API}/sendMediaGroup",
        json={"chat_id": CHAT_ID, "media": midia},
    )
    print(r.status_code, r.json())


def enviar_imagem_local():
    """Enviar uma imagem que esta no seu computador (upload de arquivo)."""
    with open("poster.jpg", "rb") as foto:
        r = requests.post(
            f"{API}/sendPhoto",
            data={
                "chat_id": CHAT_ID,
                "caption": "🎞️ <b>Novo poster oficial</b>",
                "parse_mode": "HTML",
            },
            files={"photo": foto},
        )
    print(r.status_code, r.json())


if __name__ == "__main__":
    enviar_aviso()