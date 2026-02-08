export const instructionCopy = {
  en: {
    loadingLabel: "Loading assets",
    tapHint: "Tap or click a dish for details",
    assetDisclaimer:
      "Assets belong to their owners. Do not copy or reuse this content without permission.",
    jukeboxHint: "Scroll vertically to spin the disc. Horizontal to switch sections.",
    focusRowsHint: "Scroll vertically for sections. Horizontally for dishes.",
    rotateHintTouch: "Swipe horizontally on the image to rotate",
    rotateHintMouse: "Drag horizontally with the mouse to rotate",
    rotateToggle: "Reverse rotation"
  },
  es: {
    loadingLabel: "Cargando assets",
    tapHint: "Toca o haz clic en un platillo para ver detalles",
    assetDisclaimer:
      "Los assets pertenecen a sus propietarios. No copies ni reutilices este contenido sin autorización.",
    jukeboxHint: "Desliza vertical para girar el disco. Horizontal para cambiar sección.",
    focusRowsHint: "Desliza vertical para secciones. Horizontal para platillos.",
    rotateHintTouch: "Desliza horizontal sobre la imagen para girar",
    rotateHintMouse: "Arrastra horizontal con el mouse para girar",
    rotateToggle: "Invertir giro"
  },
  fr: {
    loadingLabel: "Chargement des assets",
    tapHint: "Touchez ou cliquez sur un plat pour voir les détails",
    assetDisclaimer:
      "Les assets appartiennent à leurs propriétaires. Ne copiez ni ne réutilisez ce contenu sans autorisation.",
    jukeboxHint:
      "Faites défiler verticalement pour faire tourner le disque. Horizontalement pour changer de section.",
    focusRowsHint: "Faites défiler verticalement pour les sections. Horizontalement pour les plats.",
    rotateHintTouch: "Balayez horizontalement l'image pour faire tourner",
    rotateHintMouse: "Faites glisser horizontalement avec la souris pour faire tourner",
    rotateToggle: "Inverser la rotation"
  },
  pt: {
    loadingLabel: "Carregando assets",
    tapHint: "Toque ou clique em um prato para ver detalhes",
    assetDisclaimer:
      "Os assets pertencem aos seus proprietários. Não copie nem reutilize este conteúdo sem autorização.",
    jukeboxHint: "Deslize verticalmente para girar o disco. Horizontalmente para mudar de seção.",
    focusRowsHint: "Deslize verticalmente para seções. Horizontalmente para pratos.",
    rotateHintTouch: "Deslize horizontalmente na imagem para girar",
    rotateHintMouse: "Arraste horizontalmente com o mouse para girar",
    rotateToggle: "Inverter rotação"
  },
  it: {
    loadingLabel: "Caricamento assets",
    tapHint: "Tocca o fai clic su un piatto per vedere i dettagli",
    assetDisclaimer:
      "Gli assets appartengono ai rispettivi proprietari. Non copiare o riutilizzare questo contenuto senza autorizzazione.",
    jukeboxHint: "Scorri verticalmente per far girare il disco. Orizzontalmente per cambiare sezione.",
    focusRowsHint: "Scorri verticalmente per le sezioni. Orizzontalmente per i piatti.",
    rotateHintTouch: "Scorri orizzontalmente sull'immagine per ruotare",
    rotateHintMouse: "Trascina orizzontalmente con il mouse per ruotare",
    rotateToggle: "Inverti rotazione"
  },
  de: {
    loadingLabel: "Assets werden geladen",
    tapHint: "Tippe oder klicke auf ein Gericht, um Details zu sehen",
    assetDisclaimer:
      "Assets gehören ihren Eigentümern. Bitte nicht ohne Genehmigung kopieren oder wiederverwenden.",
    jukeboxHint: "Vertikal scrollen, um die Scheibe zu drehen. Horizontal, um die Sektion zu wechseln.",
    focusRowsHint: "Vertikal für Sektionen scrollen. Horizontal für Gerichte.",
    rotateHintTouch: "Wische horizontal über das Bild, um zu drehen",
    rotateHintMouse: "Ziehe horizontal mit der Maus, um zu drehen",
    rotateToggle: "Drehrichtung umkehren"
  },
  ja: {
    loadingLabel: "アセットを読み込み中",
    tapHint: "料理をタップまたはクリックして詳細を見る",
    assetDisclaimer:
      "アセットは各所有者に帰属します。許可なく複製・再利用しないでください。",
    jukeboxHint: "縦スクロールでディスクを回転。横スクロールでセクション切替。",
    focusRowsHint: "縦スクロールでセクション。横スクロールで料理。",
    rotateHintTouch: "画像上で横にスワイプして回転",
    rotateHintMouse: "画像上で横にドラッグして回転",
    rotateToggle: "回転方向を反転"
  },
  ko: {
    loadingLabel: "에셋 로딩 중",
    tapHint: "요리를 탭하거나 클릭해 상세 정보를 확인하세요",
    assetDisclaimer:
      "에셋은 각 소유자에게 귀속됩니다. 허가 없이 복사하거나 재사용하지 마세요.",
    jukeboxHint: "세로 스크롤로 디스크를 회전. 가로 스크롤로 섹션 전환.",
    focusRowsHint: "세로 스크롤로 섹션. 가로 스크롤로 요리.",
    rotateHintTouch: "이미지에서 가로로 스와이프해 회전",
    rotateHintMouse: "마우스로 가로로 드래그해 회전",
    rotateToggle: "회전 방향 반전"
  },
  zh: {
    loadingLabel: "正在加载素材",
    tapHint: "点按或点击菜品查看详情",
    assetDisclaimer: "素材归其所有者所有。未经许可请勿复制或再利用。",
    jukeboxHint: "纵向滚动旋转转盘，横向滚动切换分类。",
    focusRowsHint: "纵向滚动浏览分类，横向滚动浏览菜品。",
    rotateHintTouch: "在图片上横向滑动以旋转",
    rotateHintMouse: "用鼠标横向拖动以旋转",
    rotateToggle: "反向旋转"
  }
} as const;

export type InstructionKey = keyof (typeof instructionCopy)["en"];
