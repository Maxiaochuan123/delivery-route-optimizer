export const useSnackbar = () => {
  const snackbar = useState('snackbar', () => false);
  const snackbarText = useState('snackbarText', () => '');
  const snackbarColor = useState<'success' | 'error' | 'warning' | 'info'>('snackbarColor', () => 'success');

  const show = (text: string, color: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    snackbarText.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
  };

  return {
    snackbar,
    snackbarText,
    snackbarColor,
    show,
  };
};
