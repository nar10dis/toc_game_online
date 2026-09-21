import { GameService } from './game.service';
import { AuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, UseGuards, Get, Post, Body, Patch, Param, Delete, Req, Res } from '@nestjs/common';

@Controller('game')
export class GameController {
    constructor(private readonly gameService: GameService) {}

    @UseGuards(AuthGuard)
    @Post()
    createGame(@Req() req, ) {
        return this.gameService.createGame(req.user.sub, )
    }



}