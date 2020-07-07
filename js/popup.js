var helpers = chrome.extension.getBackgroundPage();
$( document ).ready( function() {
    chrome.tabs.query( { currentWindow: true, active: true }, function( tabs ) {
        var currentTab = tabs[ 0 ];
        // console.log( tabs );
        chrome.runtime.sendMessage( { host: extractHostname( currentTab.url ), action: "get_data_from_api" }, async function( response ) {
            if ( response == undefined || Object.keys( response ).length == 0 ) { return };
            $( "#loader" ).remove();
            console.log( response );
            var is_login = helpers.is_login( response );
            console.log( is_login );
            $( "#nav_user" ).append( html );
            var user = ( !nullOrundefined( response ) && !isEmpty( response ) ? response.user : [] );
            var deals = ( !nullOrundefined( response ) && !isEmpty( response ) ? response.deals : [] );
            var store = ( !nullOrundefined( response ) && !isEmpty( response ) ? response.store : [] );
            var html;
            if ( !is_login ) {
                html = `
                    <li class="nav-item">
                        <a class="nav-link" href="https://couponifier.com/login.php" target="_blank"><i class="fas fa-sign-in-alt    "></i> Login</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="https://couponifier.com/register.php" target="_blank"><i class="fas fa-user-plus" aria-hidden="true"></i> Register</a>
                    </li>
                `;
            } else {
                html = `
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-haspopup="true" aria-expanded="false">
                            ` + user[ 0 ].fullname + `
                        </a>
                        <div class="dropdown-menu dropdown-menu-right">
                            <a class="dropdown-item" href="https://couponifier.com/profile.php" target="_blank"><i class="fas fa-user    "></i> Profile</a>
                            <a class="dropdown-item" href="https://couponifier.com/settings.php" target="_blank"><i class="fas fa-cog    "></i> Settings</a>
                            <a class="dropdown-item" href="https://couponifier.com/chat.php" target="_blank"><i class="fas fa-comment    "></i> Chat</a>
                        </div>
                    </li>
                `;
            }
            $( "#user" ).append( helpers.print_user( user ) );
            $( "#deals" ).append( helpers.print_deals( deals ) );
            $( "#store" ).append( helpers.print_store( store, is_login ) );
            handle_load();
            // }
        } );
    } );
} );
window.addEventListener( "load", () => {
    
} );

function handle_load() {
    $( document ).ready( function() {
        document.getElementById( 'body' ).style.minWidth = "450px";
        $( "#loader" ).remove();
        // console.log( "I am ready" );
        $( ".deal_code" ).on( "click", function() {
            var element = $( this );
            var deal_code = $( this ).attr( "deal_code" );
            copyTextToClipboard( $( this ).attr( "deal_code" ) );
            $( this ).html( "Copied" );
            setTimeout( function(){ element.html( deal_code ) }, 3000 );
        } )
        $( ".link" ).on( "click", function() {
            window.open( $( this ).attr( "href" ) );
        } );
    } );
    $( "#store_follow_after" ).on( "click", helpers.store_follow_after );
    $( "#store_alert_after" ).on( "click", helpers.store_alert_after );
}

function print_html( data ) {
    $( "#user" ).append( data.user_html );
    $( "#deals" ).append( data.deals_html );
}