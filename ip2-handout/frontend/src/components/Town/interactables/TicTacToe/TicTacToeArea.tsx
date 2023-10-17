import {
  Button,
  List,
  ListItem,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import TicTacToeAreaController from '../../../../classes/interactable/TicTacToeAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import TicTacToeBoard from './TicTacToeBoard';
import Leaderboard from '../Leaderboard';
import PlayerController from '../../../../classes/PlayerController';
/**
 * The TicTacToeArea component renders the TicTacToe game area.
 * It renders the current state of the area, optionally allowing the player to join the game.
 *
 * It uses Chakra-UI components (does not use other GUI widgets)
 *
 * It uses the TicTacToeAreaController to get the current state of the game.
 * It listens for the 'gameUpdated' and 'gameEnd' events on the controller, and re-renders accordingly.
 * It subscribes to these events when the component mounts, and unsubscribes when the component unmounts. It also unsubscribes when the gameAreaController changes.
 *
 * It renders the following:
 * - A leaderboard , which is passed the game history as a prop
 * - A list of observers' usernames (in a list with the aria-label 'list of observers in the game', one username per-listitem)
 * - A list of players' usernames (in a list with the aria-label 'list of players in the game', one item for X and one for O)
 *    - If there is no player in the game, the username is '(No player yet!)'
 *    - List the players as (exactly) `X: ${username}` and `O: ${username}`
 * - A message indicating the current game status:
 *    - If the game is in progress, the message is 'Game in progress, {moveCount} moves in, currently {whoseTurn}'s turn'. If it is currently our player's turn, the message is 'Game in progress, {moveCount} moves in, currently your turn'
 *    - Otherwise the message is 'Game {not yet started | over}.'
 * - If the game is in status WAITING_TO_START or OVER, a button to join the game is displayed, with the text 'Join New Game'
 *    - Clicking the button calls the joinGame method on the gameAreaController
 *    - Before calling joinGame method, the button is disabled and has the property isLoading set to true, and is re-enabled when the method call completes
 *    - If the method call fails, a toast is displayed with the error message as the description of the toast (and status 'error')
 *    - Once the player joins the game, the button dissapears
 * - The TicTacToeBoard component, which is passed the current gameAreaController as a prop (@see TicTacToeBoard.tsx)
 *
 * - When the game ends, a toast is displayed with the result of the game:
 *    - Tie: description 'Game ended in a tie'
 *    - Our player won: description 'You won!'
 *    - Our player lost: description 'You lost :('
 *
 */

function ObserversList({ observers }: { observers: PlayerController[] }) {
  return (
    <List aria-label='list of observers in the game'>
      {observers.map(observer => (
        <ListItem key={(observer as PlayerController).id}>
          {(observer as PlayerController).userName}
        </ListItem>
      ))}
    </List>
  );
}

function PlayersList({
  xPlayer,
  oPlayer,
}: {
  xPlayer: PlayerController | undefined;
  oPlayer: PlayerController | undefined;
}) {
  return (
    <List aria-label='list of players in the game'>
      <ListItem>X: {xPlayer?.userName || '(No player yet!)'}</ListItem>
      <ListItem>O: {oPlayer?.userName || '(No player yet!)'}</ListItem>
    </List>
  );
}

function TicTacToeArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<TicTacToeAreaController>(interactableID);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const [forceUpdate, setForceUpdate] = useState(0);

  const gameUpdatedEventHandler = () => {
    setGameStatus(gameAreaController.status);
    setForceUpdate(prev => prev + 1);
  };

  const gameEndEventHandler = () => {
    const winner = gameAreaController.winner;
    if (
      winner?.id.toLocaleLowerCase() ===
      `player ${gameAreaController.gamePiece.toLocaleLowerCase()}`
    ) {
      toast({
        title: 'Congratulations!',
        description: 'You won!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } else if (winner) {
      toast({
        title: 'Game Over',
        description: 'You lost :(',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'Game Over',
        description: 'Game ended in a tie',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    // Initialize game status on component mount
    setGameStatus(gameAreaController.status);

    gameAreaController.addListener('gameUpdated', gameUpdatedEventHandler);
    gameAreaController.addListener('gameEnd', gameEndEventHandler);

    return () => {
      gameAreaController.removeListener('gameUpdated', gameUpdatedEventHandler);
      gameAreaController.removeListener('gameEnd', gameEndEventHandler);
    };
  }, [gameAreaController, toast, forceUpdate]);

  const handleJoinGame = async () => {
    setIsLoading(true);
    try {
      await gameAreaController.joinGame();
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Error',
          description: `Error: ${error.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
    setIsLoading(false);
  };

  if (!gameStatus) {
    return <p>Loading...</p>;
  }

  const currentPlayerPiece = gameAreaController.gamePiece;
  const currentPlayerID = gameAreaController.whoseTurn?.id;

  let currentPlayerTurn = 'unknown player';
  if (currentPlayerPiece && currentPlayerID === `player ${currentPlayerPiece.toLowerCase()}`) {
    currentPlayerTurn = 'your';
  } else if (gameAreaController.whoseTurn?.userName) {
    currentPlayerTurn = `${gameAreaController.whoseTurn.userName}'s`;
  }

  const gameMessage =
    gameStatus === 'IN_PROGRESS'
      ? `Game in progress, ${gameAreaController.moveCount} moves in, currently ${currentPlayerTurn} turn.`
      : `Game ${gameStatus === 'WAITING_TO_START' ? 'not yet started' : 'over'}.`;

  return (
    <div>
      <Leaderboard results={gameAreaController.history} />
      <ObserversList observers={gameAreaController.observers} />
      <PlayersList xPlayer={gameAreaController.x} oPlayer={gameAreaController.o} />
      <p>{gameMessage}</p>
      {(gameStatus === 'WAITING_TO_START' || gameStatus === 'OVER') &&
        !gameAreaController.isPlayer && (
          <Button onClick={handleJoinGame} isLoading={isLoading}>
            Join New Game
          </Button>
        )}

      <TicTacToeBoard gameAreaController={gameAreaController} />
    </div>
  );
}

// Do not edit below this line
/**
 * A wrapper component for the TicTacToeArea component.
 * Determines if the player is currently in a tic tac toe area on the map, and if so,
 * renders the TicTacToeArea component in a modal.
 *
 */
export default function TicTacToeAreaWrapper(): JSX.Element {
  const gameArea = useInteractable<GameAreaInteractable>('gameArea');
  const townController = useTownController();
  const closeModal = useCallback(() => {
    if (gameArea) {
      townController.interactEnd(gameArea);
      const controller = townController.getGameAreaController(gameArea);
      controller.leaveGame();
    }
  }, [townController, gameArea]);

  if (gameArea && gameArea.getData('type') === 'TicTacToe') {
    return (
      <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <TicTacToeArea interactableID={gameArea.name} />;
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
