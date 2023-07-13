import CommandPalette from 'react-command-palette';
import { useNavigate } from 'react-router-dom';
import { routes } from '../App/routes';
import './OmniBar.css';
import { atom, useRecoilState } from 'recoil';
import { reProcessCommands } from './commands';
import { useEffect } from 'react';

const omniTheme = {
  container: 'atom-container',
  containerOpen: 'atom-containerOpen',
  content: 'atom-content',
  header: 'atom-header',
  input: 'atom-input',
  inputFocused: 'atom-inputFocused',
  inputOpen: 'atom-inputOpen',
  modal: 'atom-modal',
  overlay: 'atom-overlay',
  spinner: 'atom-spinner',
  suggestion: 'atom-suggestion',
  suggestionFirst: 'atom-suggestionFirst',
  suggestionHighlighted: 'atom-suggestionHighlighted',
  suggestionsContainer: 'atom-suggestionsContainer',
  suggestionsContainerOpen: 'atom-suggestionsContainerOpen',
  suggestionsList: 'atom-suggestionsList',
};

const commandState = atom({
  key: 'commandsState',
  default: [],
});

const categoryColorPallete = {
  Navigate: 'navigate',
};

const renderCommand = (suggestion) => {
  const { name, category } = suggestion;
  return (
    <>
      <span className={categoryColorPallete[category]}>{category}</span>
      <span className="command-name">{name}</span>
    </>
  );
};

const OmniBar = () => {
  const navigate = useNavigate();
  const [commands, setCommands] = useRecoilState(commandState);
  useEffect(() => {
    setCommands(
      reProcessCommands(commands, {
        type: 'Navigate',
        extras: { navigate },
        routes,
      })
    );
  }, [setCommands, commands, navigate]);
  return (
    <CommandPalette
      alwaysRenderCommands
      highlightFirstSuggestion
      closeOnSelect
      resetInputOnOpen
      placeholder="Type a command"
      reactModalParentSelector="body"
      shouldReturnFocusAfterClose
      trigger={null}
      display="modal"
      hotKeys="command+k"
      maxDisplayed={10}
      theme={omniTheme}
      commands={commands}
      renderCommand={renderCommand}
    />
  );
};

export default OmniBar;
