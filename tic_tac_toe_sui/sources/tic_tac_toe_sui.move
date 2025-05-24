module tic_tac_toe_sui::tic_tac_toe_sui {
    use sui::object;
    use sui::tx_context;
    use sui::transfer;
    use std::vector;

    /// Game status: 0 = waiting, 1 = playing, 2 = finished
    const STATUS_WAITING: u8 = 0;
    const STATUS_PLAYING: u8 = 1;
    const STATUS_FINISHED: u8 = 2;

    /// Result: 0 = none, 1 = X wins, 2 = O wins, 3 = draw
    const RESULT_NONE: u8 = 0;
    const RESULT_X_WINS: u8 = 1;
    const RESULT_O_WINS: u8 = 2;
    const RESULT_DRAW: u8 = 3;

    public struct Game has key {
        id: UID,
        player_x: address,
        player_o: address,
        board: vector<u8>,
        turn: u8,
        status: u8,
        result: u8,
    }

    public entry fun create_game(ctx: &mut TxContext) {
        let game = Game {
            id: object::new(ctx),
            player_x: tx_context::sender(ctx),
            player_o: @0x0,
            board: create_empty_board(),
            turn: 1,
            status: STATUS_WAITING,
            result: RESULT_NONE,
        };
        transfer::transfer(game, tx_context::sender(ctx))
    }

    fun create_empty_board(): vector<u8> {
        let mut board = vector::empty();
        let mut i = 0;
        while (i < 9) {
            vector::push_back(&mut board, 0);
            i = i + 1;
        };
        board
    }

    public entry fun join_game(game: &mut Game, ctx: &mut TxContext) {
        assert!(game.status == STATUS_WAITING, 0);
        let sender = tx_context::sender(ctx);
        assert!(sender != game.player_x, 1);
        game.player_o = sender;
        game.status = STATUS_PLAYING;
    }

    public entry fun make_move(game: &mut Game, row: u8, col: u8, ctx: &mut TxContext) {
        assert!(game.status == STATUS_PLAYING, 2);
        let sender = tx_context::sender(ctx);
        let idx = ((row as u64) * 3 + (col as u64));
        assert!(idx < 9, 3);
        assert!(*vector::borrow(&game.board, idx) == 0, 4);

        if (game.turn == 1) {
            assert!(sender == game.player_x, 5);
        } else {
            assert!(sender == game.player_o, 6);
        };

        let current_turn = game.turn;
        *vector::borrow_mut(&mut game.board, idx) = current_turn;

        let winner = check_winner(&game.board);
        if (winner != 0) {
            game.status = STATUS_FINISHED;
            game.result = winner;
        } else {
            if (is_draw(&game.board)) {
                game.status = STATUS_FINISHED;
                game.result = RESULT_DRAW;
            } else {
                game.turn = if (game.turn == 1) 2 else 1;
            }
        }
    }

    fun check_winner(board: &vector<u8>): u8 {
        let lines = make_lines();
        let mut i = 0;
        while (i < vector::length(&lines)) {
            let line = vector::borrow(&lines, i);
            let a = *vector::borrow(board, (*vector::borrow(line, 0) as u64));
            let b = *vector::borrow(board, (*vector::borrow(line, 1) as u64));
            let c = *vector::borrow(board, (*vector::borrow(line, 2) as u64));
            if (a != 0 && a == b && b == c) {
                if (a == 1) { 
                    return RESULT_X_WINS 
                } else { 
                    return RESULT_O_WINS 
                }
            };
            i = i + 1;
        };
        RESULT_NONE
    }

    fun make_lines(): vector<vector<u8>> {
        let mut lines = vector::empty();
        vector::push_back(&mut lines, make_vec3(0,1,2));
        vector::push_back(&mut lines, make_vec3(3,4,5));
        vector::push_back(&mut lines, make_vec3(6,7,8));
        vector::push_back(&mut lines, make_vec3(0,3,6));
        vector::push_back(&mut lines, make_vec3(1,4,7));
        vector::push_back(&mut lines, make_vec3(2,5,8));
        vector::push_back(&mut lines, make_vec3(0,4,8));
        vector::push_back(&mut lines, make_vec3(2,4,6));
        lines
    }

    fun make_vec3(a: u8, b: u8, c: u8): vector<u8> {
        let mut v = vector::empty();
        vector::push_back(&mut v, a);
        vector::push_back(&mut v, b);
        vector::push_back(&mut v, c);
        v
    }

    fun is_draw(board: &vector<u8>): bool {
        let mut i = 0;
        while (i < vector::length(board)) {
            if (*vector::borrow(board, i) == 0) {
                return false
            };
            i = i + 1;
        };
        true
    }
}