import { Button, chakra, Container } from '@chakra-ui/react';
import React from 'react';
import TicTacToeAreaController from '../../../../classes/interactable/TicTacToeAreaController';

export type TicTacToeGameProps = {
  gameAreaController: TicTacToeAreaController;
};

/**
 * A component that will render a single cell in the TicTacToe board, styled
 */
const StyledTicTacToeSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    flexBasis: '33%',
    border: '1px solid black',
    height: '33%',
    fontSize: '50px',
    _disabled: {
      opacity: '100%',
    },
  },
});

/**
 * A component that will render the TicTacToe board, styled
 */
const StyledTicTacToeBoard = chakra(Container, {
  baseStyle: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)', // 3 columns
    gridTemplateRows: 'repeat(3, 1fr)', // 3 rows
    width: '400px',
    height: '400px',
    padding: '5px',
  },
});

/**
 * A component that renders the TicTacToe board
 *
 * Renders the TicTacToe board as a "StyledTicTacToeBoard", which consists of 9 "StyledTicTacToeSquare"s
 * (one for each cell in the board, starting from the top left and going left to right, top to bottom).
 * Each StyledTicTacToeSquare has an aria-label property that describes the cell's position in the board,
 * formatted as `Cell ${rowIndex},${colIndex`.
 *
 * The board is re-rendered whenever the board changes, and each cell is re-rendered whenever the value
 * of that cell changes.
 *
 * If the current player is in the game, then each StyledTicTacToeSquare is clickable, and clicking
 * on it will make a move in that cell. If there is an error making the move, then a toast will be
 * displayed with the error message as the description of the toast. If it is not the current player's
 * turn, then the StyledTicTacToeSquare will be disabled.
 *
 * @param gameAreaController the controller for the TicTacToe game
 */
export default function TicTacToeBoard({ gameAreaController }: TicTacToeGameProps): JSX.Element {
  return (
    <StyledTicTacToeBoard aria-label='Tic-Tac-Toe Board'>
      {gameAreaController.board.map((row, rowIndex) =>
        row.map((cellValue, colIndex) => (
          <StyledTicTacToeSquare
            key={`${rowIndex}-${colIndex}`}
            aria-label={`Cell ${rowIndex},${colIndex}`}>
            {cellValue}
          </StyledTicTacToeSquare>
        )),
      )}
    </StyledTicTacToeBoard>
  );
}
