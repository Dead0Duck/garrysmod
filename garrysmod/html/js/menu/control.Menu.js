
if (!IN_ENGINE)
{
	window.util = {
		MotionSensorAvailable: function() { return false; }
	}
}

var gScope = null;
var GamemodeDetails = {}
var MapIndex = {}

var subscriptions = new Subscriptions();

function MenuController( $scope, $rootScope )
{
	$rootScope.ShowBack = false;
	$scope.Version = "0";
	$scope.ProblemCount = 0;
	$scope.ProblemSeverity = 0;

	subscriptions.Init( $scope );

	gScope = $scope;

	gScope.Gamemode = '';

	$scope.ToggleGamemodes = function()
	{
		$( '.popup:not(.gamemode_list)' ).hide();
		$( '.gamemode_list' ).toggle();
	}

	$scope.ToggleLanguage = function()
	{
		$( '.popup:not(.language_list)' ).hide();
		$( '.language_list' ).toggle();
	}

	$scope.ToggleGames = function()
	{
		$( '.popup:not(.games_list)' ).hide();
		$( '.games_list' ).toggle();
	}

	$scope.TogglePopup = function( name )
	{
		$( '.popup:not('+name+')' ).hide();
		$( name ).toggle();
	}

	$scope.SelectGamemode = function( gm )
	{
		$scope.Gamemode = gm.name;
		$scope.GamemodeTitle = gm.title;
		lua.Run( "RunConsoleCommand( \"gamemode\", %s )", gm.name );

		$( '.gamemode_list' ).hide();
	}

	$scope.SelectLanguage = function( lang )
	{
		$rootScope.Language = lang;
		lua.Run( "RunConsoleCommand( \"gmod_language\", %s )", lang );

		$( '.language_list' ).hide();
	}

	$scope.MenuOption = function( btn, v )
	{
		lua.Run( "RunGameUICommand( %s )", v );
	}

	$scope.IfElse = function( b, a, c )
	{
		if ( b ) return a;
		return c;
	}

	//
	// Map List
	//
	$rootScope.MapList = [];
	$rootScope.AddonMapList = [];
	lua.Run( "UpdateMapList()" );

	//
	// Languages
	//
	$rootScope.Languages = []
	$rootScope.Language = 'en';
	lua.Run( "UpdateLanguages()" );

	//
	// Game Mounts
	//
	$scope.GameMountChanged = function( mount )
	{
		var bMount = mount.mounted ? "true" : "false";
		lua.Run( "engine.SetMounted( %s, " + bMount + " )", String( mount.depot ) );
	}

	//
	// Controls
	//
	$scope.BackToGame = function()
	{
		lua.Run( "gui.HideGameUI()" );
	}

	$scope.ToggleServerFavorites = function( bAdd )
	{
		var bAdd = bAdd ? "true" : "false";
		lua.Run( "serverlist.AddCurrentServerToFavorites( " + bAdd + " )" );
	}

	$scope.Disconnect = function()
	{
		lua.Run( "RunConsoleCommand( 'disconnect' )" );
	}

	$scope.OpenWorkshopFile = function( id )
	{
		if ( !id ) return;

		lua.Run( "steamworks.ViewFile( %s )", String( id ) );
	}

	$scope.OpenFolder = function( foldername )
	{
		lua.Run( "OpenFolder( %s )", String( foldername ) );
	}

	$scope.OpenWorkshop = function()
	{
		lua.Run( "steamworks.OpenWorkshop()" );
	}

	$scope.ShowNews = function()
	{
		if ( gScope.Branch != "unknown" ) return lua.Run( "gui.OpenURL( 'https://commits.facepunch.com/r/Garrys%20Mod' )" );

		lua.Run( "gui.OpenURL( 'http://gmod.facepunch.com/changes/' )" );
	}

	$scope.ToggleProblems = function()
	{
		lua.Run( "OpenProblemsPanel()" );
	}

	// InGame
	$scope.InGame = false;
	$scope.ShowFavButton = false;
	$scope.IsCurrentServerFav = false;

	// Kinect options
	$scope.kinect =
	{
		available: util.MotionSensorAvailable(),
		show_color: false,
		color_options: [ "topleft", "topright", "bottomleft", "bottomright" ],
		color: "bottomleft",
		size_options: [ "small", "medium", "large" ],
		color_size:	"medium",

		update: function()
		{
			// Start the kinect
			if ( $scope.kinect.show_color )
			{
				lua.Run( "motionsensor.Start()" );
			}

			if ( $scope.kinect.color == "topleft" )		{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"32\" )" ); }
			if ( $scope.kinect.color == "topright" )	{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"-32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"32\" )" ); }
			if ( $scope.kinect.color == "bottomright" )	{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"-32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"-32\" )" ); }
			if ( $scope.kinect.color == "bottomleft" )	{ lua.Run( "RunConsoleCommand( \"sensor_color_x\", \"32\" )" ); lua.Run( "RunConsoleCommand( \"sensor_color_y\", \"-32\" )" ); }

			if ( $scope.kinect.color_size == "small" ) { lua.Run( "RunConsoleCommand( \"sensor_color_scale\", \"0.4\" )" ); }
			if ( $scope.kinect.color_size == "medium" ) { lua.Run( "RunConsoleCommand( \"sensor_color_scale\", \"0.7\" )" ); }
			if ( $scope.kinect.color_size == "large" ) { lua.Run( "RunConsoleCommand( \"sensor_color_scale\", \"1.0\" )" ); }

			lua.Run( "RunConsoleCommand( \"sensor_color_show\", %s )", $scope.kinect.show_color ? "1" : "0" );
		}
	}

	util.MotionSensorAvailable( function( available ) {
		$scope.kinect.available = available;
	} );
}

function SetInGame( bInGame )
{
	gScope.InGame = bInGame;
	UpdateDigest( gScope, 50 );
}

function SetShowFavButton( bShow, bFav )
{
	gScope.ShowFavButton = bShow;
	gScope.IsCurrentServerFav = bFav;
	UpdateDigest( gScope, 50 );
}

function UpdateGamemodes( gm )
{
	gScope.Gamemodes = [];
	for ( k in gm )
	{
		var gi = GetGamemodeInfo( gm[k].name );
		gi.title = gm[k].title
		gi.name = gm[k].name

		gScope.Gamemodes.push( gm[k] );
	}

	UpdateDigest( gScope, 50 );
}

function UpdateCurrentGamemode( gm )
{
	if ( gScope.Gamemode == gm ) return;

	gScope.Gamemode = gm;

	for ( k in gScope.Gamemodes )
	{
		if ( gScope.Gamemodes[k].name == gm )
			gScope.GamemodeTitle = gScope.Gamemodes[k].title;
	}

	UpdateDigest( gScope, 50 );
}

function GetGamemodeInfo( name )
{
	name = name.toLowerCase();
	if ( !GamemodeDetails[name] ) GamemodeDetails[name] = {}

	return GamemodeDetails[name];
}

function UpdateAddonMaps( inmaps )
{
	gScope.AddonMapList = inmaps;
	UpdateDigest( gScope, 50 );
}

function UpdateMaps( inmaps )
{
	var mapList = []

	for ( k in inmaps )
	{
		var order = k;
		if ( k == 'Sandbox' ) order = '2';
		if ( k == 'Favourites' ) order = '1';

		var maps = []
		for ( v in inmaps[k] )
		{
			maps.push( inmaps[k][v] );
			MapIndex[ inmaps[k][v].toLowerCase() ] = true;
		}

		mapList.push(
		{
			order: order,
			category: k,
			maps: maps
		} )
	}

	gScope.MapList = mapList;
	UpdateDigest( gScope, 50 );
}

function DoWeHaveMap( map )
{
	return MapIndex[map.toLowerCase()] || false;
}

function UpdateLanguages( lang )
{
	gScope.Languages = [];

	for ( k in lang )
	{
		gScope.Languages.push( lang[k].substr( 0, lang[k].length - 4 ) )
	}
}

function UpdateLanguage( lang )
{
	gScope.Language = lang;
	gScope.$broadcast( "languagechanged" );
	UpdateDigest( gScope, 50 );
}

function UpdateGames( games )
{
	gScope.Games = [];

	for ( k in games )
	{
		games[k].mounted	= games[k].mounted == 1;
		games[k].installed	= games[k].installed == 1;
		games[k].owned		= games[k].owned == 1;

		gScope.Games.push( games[k] )
	}

	UpdateDigest( gScope, 50 );
}

function UpdateVersion( version, netVersion, branch )
{
	GMOD_VERSION_INT = parseInt( netVersion.replace( /\./g, "" ) ); // For server browser

	gScope.Version	= version;
	gScope.Branch	= branch;

	UpdateDigest( gScope, 100 );
}

function SetProblemCount( num, severity )
{
	gScope.ProblemCount		= num;
	gScope.ProblemSeverity	= severity;

	UpdateDigest( gScope, 100 );
}

//
// Setup sounds..
//
$(document).on( "mouseenter", ".options a",			function() { lua.PlaySound( "garrysmod/ui_hover.wav" ); } );
$(document).on( "click", ".options a",				function() { lua.PlaySound( "garrysmod/ui_click.wav" ); } );
$(document).on( "mouseenter", ".noisy",				function() { lua.PlaySound( "garrysmod/ui_hover.wav" ); } );
$(document).on( "click", ".noisy",					function() { lua.PlaySound( "garrysmod/ui_click.wav" ); } );
$(document).on( "mouseenter", ".ui_sound_return",	function() { lua.PlaySound( "garrysmod/ui_hover.wav" ); } );
$(document).on( "click", ".ui_sound_return",		function() { lua.PlaySound( "garrysmod/ui_return.wav" ); } );
