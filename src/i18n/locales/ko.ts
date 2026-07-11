import type { Locale } from './types';

// Korean translations. Tone matches the original wrapFlow.ts strings authored
// by the project owner. Keep dictionary keys 1:1 with en.ts.
export const ko: Locale = {
	settings: {
		colors: {
			heading: '강조 색상',
			desc: '플러그인이 사용하는 색상을 관리합니다. 비활성화된 색상은 우클릭 메뉴에서 숨겨지지만 노트에는 그대로 렌더링됩니다.',
			addButton: '색상 추가',
			row: {
				moveUp: '위로 이동',
				moveDown: '아래로 이동',
				enabled: '활성화',
				slug: '슬러그',
				colorPicker: '색상 선택기',
				hexValue: '헥스 값',
				hotkeyLabel: '단축키: {hotkey}',
				hotkeyNone: '단축키 미할당',
				hotkeyConfigure: '단축키 설정',
				delete: '색상 삭제',
			},
		},
		style: {
			heading: '강조 스타일',
			desc: '모든 강조에 적용되는 시각 스타일입니다.',
			options: {
				default: '기본 (솔리드)',
				lowlight: '로우라이트 (iA Writer)',
				underlined: '언더라인',
			},
		},
	},
	menu: {
		highlight: '강조',
		changeColor: '색상 변경',
		unhighlight: '강조 제거',
	},
	commands: {
		openPalette: '색상 팔레트 열기',
		unhighlight: '강조 제거',
	},
	notice: {
		noSelectionOrHighlight: '선택 영역이나 활성 강조가 없습니다',
	},
	modal: {
		confirm: {
			defaultOk: '확인',
			defaultCancel: '취소',
		},
		backtick: {
			title: '인라인 코드',
			message: '선택 영역이 인라인 코드(`)와 연관됩니다. 백틱을 제거하고 강조를 적용할까요?',
			confirm: '백틱 제거 후 강조',
			cancel: '취소',
		},
	},
};
