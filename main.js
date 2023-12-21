let APP_ID = 'ab61300f39494201abb2be04992ec9e4' 

let token = null;
let uid = String(Math.floor(Math.random()*1000000))

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

// Track the number of participants in the room
let participantsCount = 0;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let roomId = urlParams.get('room')
console.log(roomId)

if(!roomId){
    window.location = 'lobby.html'

}

const servers = {
    iceServers:[
        {
            urls:[ 'stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let constraints ={
    video:{
        width:{
            min:640, ideal:1920, max: 1920
        },
        height:{
            min:480, ideal:1080, max:1080
        },
        audio:true
    }
}

let init = async() => {
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    channel= client.createChannel(roomId)
    await channel.join()

    channel.on('MemberJoined', handleUserJoined)
    channel.on('MemberLeft', handleMemberLeft )

    client.on('MessageFromPeer', handleMessageFromPeer )


    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
    document.getElementById('user-1').srcObject = localStream

    // Increment the participant count when the local user joins
    participantsCount++;
    
}

let handleUserJoined =async (MemberId) => {
    console.log(participantsCount)
    if (participantsCount < 2) {
        console.log('A new user has joined', MemberId);
        createOffer(MemberId);
    
        // Increment the participant count when a new user joins
        participantsCount++;
      } else {
        // If more than two participants attempt to join, reject them or take appropriate action
        console.log('Room is full. Rejecting additional participant:', MemberId);
        client.sendMessageToPeer(
            {
              text: JSON.stringify({
                type: 'room_full',
                message: 'The room is full. Cannot join.',
              }),
            },
            MemberId
          );
          MemberId = 'rejectedParticipantId'
      
          if (MemberId === 'rejectedParticipantId') {
            window.location.href = 'lobby.html';
          } // Adjust the delay as needed
        // You might want to inform the participant that the room is full and take action accordingly
      }
}

let handleMemberLeft = (MemberID) =>{
    document.getElementById('user-2').style.display= 'none'
    document.getElementById('user-1').classList.remove('small-frame')

     // Decrement the participant count when a user leaves
  participantsCount--;
    
}

let handleMessageFromPeer = async(message, MemberId) =>{
    message =JSON.parse(message.text)
    if(message.type ==='offer'){
        createAnswer(MemberId, message.offer)
    }
    if(message.type === 'answer'){
       addAnswer(message.answer)
    }
    if(message.type === 'candidate'){
        await peerConnection.addIceCandidate(message.candidate)
     }
}

let createPeerConnection = async(MemberId) =>{
    peerConnection = new RTCPeerConnection(servers)

    remoteStream= new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'
    document.getElementById('user-1').classList.add('small-frame')
    

    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        // Mute audio track for local stream
        if (track.kind === 'audio') {
          track.enabled = false;
        }
        peerConnection.addTrack(track, localStream);
      });
  

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            
            remoteStream.addTrack(track)
        }
        )
    }

    peerConnection.onicecandidate =  (event) => {
        if(event.candidate){
        client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate': event.candidate})}, MemberId)
        }
    }
}

let createOffer = async(MemberId) => {
    await createPeerConnection(MemberId)
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer': offer})}, MemberId)
}

let createAnswer = async(MemberId, offer) =>{
    await createPeerConnection(MemberId)

    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    client.sendMessageToPeer(
        { text: JSON.stringify({ type: 'answer', answer: answer }) },
        MemberId
      )
}

let addAnswer = async (answer) =>{
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}
let leaveChannel = async() =>{
    await channel.leave
    await client.logout()
}


let tooglecamera = async () =>{
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')
    if(videoTrack.enabled){
        videoTrack.enabled = false;
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255,80,80)'
    
    }else{
        videoTrack.enabled= true
        document.getElementById('camera-btn').style.backgroundColor= 'rgb(179, 102, 249)'
    
    }
}

let tooglemic = async () =>{
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
    if(audioTrack.enabled){
        audioTrack.enabled = false;
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255,80,80)'
    
    }else{
        audioTrack.enabled= true
        document.getElementById('mic-btn').style.backgroundColor= 'rgb(179, 102, 249)'
    
    }
}



window.addEventListener('beforeunload', leaveChannel)

document.getElementById('camera-btn').addEventListener('click', tooglecamera)
document.getElementById('mic-btn').addEventListener('click', tooglemic)



init()



// Better version of my code 

// Ensure that APP_ID is defined somewhere in your code

// Initialize variables
// let token = null;
// let uid = String(Math.floor(Math.random() * 1000000));

// let client;
// let channel;

// let localStream;
// let remoteStream;
// let peerConnection;

// // ICE servers configuration
// const servers = {
//   iceServers: [
//     {
//       urls: [
//         'stun:stun.l.google.com:19302',
//         'stun:stun1.l.google.com:19302',
//         'stun:stun2.l.google.com:19302',
//       ],
//     },
//   ],
// };

// // Initialize the application
// let init = async () => {
//   try {
//     // Create and log in to Agora RTM client
//     client = await AgoraRTM.createInstance(APP_ID);
//     await client.login({ uid, token });

//     // Create and join a channel
//     channel = client.createChannel('main');
//     await channel.join();

//     // Set up event handlers
//     channel.on('MemberJoined', handleUserJoined);
//     client.on('MessageFromPeer', handleMessageFromPeer);

//     // Get local media stream and display it
//     localStream = await navigator.mediaDevices.getUserMedia({
//       video: true,
//       audio: false,
//     });
//     document.getElementById('user-1').srcObject = localStream;
//   } catch (error) {
//     console.error('Initialization error:', error);
//   }
// };

// // Handle the event when a new user joins the channel
// let handleUserJoined = async (MemberId) => {
//   console.log('A new user has joined', MemberId);
//   createOffer(MemberId);
// };

// // Handle incoming messages from peers
// let handleMessageFromPeer = async (message, MemberId) => {
//   try {
//     if (message.text) {
//       // Parse the incoming message
//       message = JSON.parse(message.text);

//       // Handle different message types
//       if (message.type === 'offer') {
//         await createPeerConnection(MemberId);
//         await peerConnection.setRemoteDescription(message.offer);
//         let answer = await peerConnection.createAnswer();
//         await peerConnection.setLocalDescription(answer);
//         // Send the answer to the peer
//         client.sendMessageToPeer(
//           { text: JSON.stringify({ type: 'answer', answer: answer }) },
//           MemberId
//         );
//       } else if (message.type === 'answer') {
//         await addAnswer(message.answer);
//       } else if (message.type === 'candidate') {
//         // Add ICE candidate received from the peer
//         await peerConnection.addIceCandidate(message.candidate);
//       }
//     }
//   } catch (error) {
//     console.error('Error handling message from peer:', error);
//   }
// };

// // Create an RTCPeerConnection and set up event handlers
// let createPeerConnection = async (MemberId) => {
//   try {
//     peerConnection = new RTCPeerConnection(servers);

//     // Create a new media stream for remote video display
//     remoteStream = new MediaStream();
//     document.getElementById('user-2').srcObject = remoteStream;

//     // If local stream is not available, get it and display
//     if (!localStream) {
//       localStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: false,
//       });
//       document.getElementById('user-1').srcObject = localStream;
//     }

//     // Add local tracks to the peer connection
//     localStream.getTracks().forEach((track) => {
//       peerConnection.addTrack(track, localStream);
//     });

//     // Set up event handler for incoming tracks
//     peerConnection.ontrack = (event) => {
//       event.streams.forEach((stream) => {
//         stream.getTracks().forEach((track) =>
//           remoteStream.addTrack(track)
//         );
//       });
//     };

//     // Set up event handler for ICE candidate generation
//     peerConnection.onicecandidate = async (event) => {
//       if (event.candidate) {
//         // Send ICE candidate to the peer
//         client.sendMessageToPeer(
//           {
//             text: JSON.stringify({
//               type: 'candidate',
//               candidate: event.candidate,
//             }),
//           },
//           MemberId
//         );
//       }
//     };
//   } catch (error) {
//     console.error('Error creating peer connection:', error);
//   }
// };

// // Create and send an offer to a peer
// let createOffer = async (MemberId) => {
//   try {
//     await createPeerConnection(MemberId);
//     let offer = await peerConnection.createOffer();
//     await peerConnection.setLocalDescription(offer);
//     // Send the offer to the peer
//     client.sendMessageToPeer(
//       { text: JSON.stringify({ type: 'offer', offer: offer }) },
//       MemberId
//     );
//   } catch (error) {
//     console.error('Error creating offer:', error);
//   }
// };

// // Create an answer to an incoming offer
// let createAnswer = async (MemberId, offer) => {
//   try {
//     await createPeerConnection(MemberId);

//     // Set the remote description with the incoming offer
//     await peerConnection.setRemoteDescription(offer);

//     // Create and set the local answer
//     let answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);
//   } catch (error) {
//     console.error('Error creating answer:', error);
//   }
// };

// // Add an incoming answer to the peer connection
// let addAnswer = async (answer) => {
//   try {
//     // Check if a remote description exists before setting it
//     if (!peerConnection.currentRemoteDescription) {
//       await peerConnection.setRemoteDescription(answer);
//     }
//   } catch (error) {
//     console.error('Error adding answer:', error);
//   }
// };

// // Initialize the application
// init();

