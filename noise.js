(function(){
   this.Noise=function(){
      if(arguments[0]){
         var settings=arguments[0];
         for(var key in settings){
             var value=settings[key];
             this[key]=value;
          }
      }else{
         throw "settings are required";
      }
      /*
      this.frequency     
      this.hashSetting---range,num,mask
      this.size---x,y,z 
      this.dimension   
      */
      /*fracal noise only
      this.octaves from 1-8
      this.lacunarity from 1-4
      this.persistence frim 0-1  
      */
      this.hash=[];
   };

   Noise.prototype.changeSetting=function(type){
   	   var root=this;
       if(type=="hash"){
       	root.hashSetting.range=arguments[1];
       	root.hashSetting.num=arguments[2];
       	root.initial();
       }else if(type=="size"){
       	 root.size.x=arguments[1];
       	 if(arguments[2]) root.size.y=arguments[2];
       	 if(arguments[3]) root.size.z=arguments[3];
       }else{
        root[type]=arguments[1];
       }
   };

   Noise.prototype.initial=function(){
   	   var root=this;
       createRandomHash.call(root);
       return root;
   };

   Noise.prototype.value=function(input,dim){
   	    var root=this;
        var method=getValueMethod(dim);     
        return method.call(root,input,root.frequency);
   };

   Noise.prototype.perlin=function(input,dim){
        var root=this;
        var method=getPerlinMethod(dim);     
        return method.call(root,input,root.frequency);
   };

   Noise.prototype.fracal=function(input,dim,type){
        var root=this;
        if(root.octaves) {
          return fracal.call(root,input,dim,type);
        }else{
          if(type=="value") return fracalValue_basic.call(root,input,dim);
          if(type=="perlin") return fracalPerlin_basic.call(root,input,dim);
        }       
   };

   Noise.prototype.method=function(type){
       var root=this;
       return root[type];
   };
  
   //value noise
   function value1D(input){
      var root=this;
      var v=input.clone().multiplyScalar(root.frequency);//input.clone().divideScalar(root.size)
      var i=Math.floor(v.x);
      i &= root.hashSetting.mask;
      return root.hash[i]/root.hashSetting.mask;
   }

   function value2D(input){
      var root=this;
      var mask=root.hashSetting.mask,
          hash=root.hash;
      var v=input.clone().multiplyScalar(root.frequency);//input.clone().divideScalar(root.size)
      var ix=Math.floor(v.x),
          iy=Math.floor(v.y);
      ix &= mask;
      iy &= mask;
      //return hash[(hash[ix] + iy) & mask]*(1/mask);
      return hash[parseInt(hash[ix]) + iy] * (1/mask);
   }

   function value3D(input){
      var root=this;
      var mask=root.hashSetting.mask,
          hash=root.hash;
      var v=input.clone().multiplyScalar(root.frequency);
      var ix=Math.floor(v.x),
          iy=Math.floor(v.y),
          iz=Math.floor(v.z);
      ix &= mask;
      iy &= mask;
      iz &= mask;
      //return hash[(hash[(hash[ix] + iy) & mask) +iz & mask]*(1/mask);
      return hash[parseInt(hash[parseInt(hash[ix]) + iy])+ iz]*(1/mask);      
   }

   var value1Dg=function(input,frequency){
      var root=this;
      var mask=root.hashSetting.mask,
          hash=root.hash;
      var v=input.clone().multiplyScalar(frequency);
      var i0=Math.floor(v.x);
      var t=v.x-i0;
      i0 &= mask;
      var i1=i0+1;

      var h0=hash[i0],
          h1=hash[i1];

      return lerp(h0,h1,t,1) * (1/mask);
   }

  var value2Dg=function(input,frequency){
      var root=this;
      var mask=root.hashSetting.mask,
          hash=root.hash;
      var v=input.clone().multiplyScalar(frequency);
      var ix0=Math.floor(v.x),
          iy0=Math.floor(v.y);
      var tx=smooth(v.x-ix0),
          ty=smooth(v.y-iy0);
      ix0 &= mask;
      iy0 &= mask;
      var ix1=ix0+1,
          iy1=iy0+1;

      var h0=hash[ix0],
          h1=hash[ix1],
          h00=hash[parseInt(h0+iy0)],
          h10=hash[parseInt(h1+iy0)],
          h01=hash[parseInt(h0+iy1)],
          h11=hash[parseInt(h1+iy1)];
      var st1=lerp(h00,h10,tx,1),
          st2=lerp(h01,h11,tx,1);
      return lerp(st1,st2,ty,1) * (1/mask);
   }

   function getValueMethod(dim){
      var func;
      if(dim==1)  func=value1Dg;
      if(dim==2)  func=value2Dg;
      return func;
   }

   //perlin noise

   var perlin1D=function(input,frequency){
      var root=this;
      var gradients1D=[1,-1],
          gradientsMask1D=1;
      var mask=root.hashSetting.mask,
          hash=root.hash;

      var v=input.clone().multiplyScalar(frequency);
      var i0=Math.floor(v.x);
      var t0=v.x-i0,
          t1=t0-1,
          t=smooth(t0);
      i0&=mask;
      var i1=i0+1;

      var g0=gradients1D[hash[i0]&gradientsMask1D],
          g1=gradients1D[hash[i1]&gradientsMask1D],
          v0=g0*t0,
          v1=g1*t1;

      return lerp(v0,v1,t,1);
   };


  var perlin2D=function(input,frequency){
      var root=this;
      var gradients2D=[new THREE.Vector2(1,0),
                       new THREE.Vector2(-1,0),
                       new THREE.Vector2(0,1),
                       new THREE.Vector2(0,-1),
                       new THREE.Vector2( 1, 1).normalize(),
                       new THREE.Vector2(-1, 1).normalize(),
                       new THREE.Vector2( 1,-1).normalize(),
                       new THREE.Vector2(-1,-1).normalize()
                       ],
          gradientsMask2D=7;
      var mask=root.hashSetting.mask,
          hash=root.hash;

      var v=input.clone().multiplyScalar(frequency);
      var ix0=Math.floor(v.x),
          iy0=Math.floor(v.y);
      var tx0=v.x-ix0,
          tx1=tx0-1,
          ty0=v.y-iy0,
          ty1=ty0-1;
          tx=smooth(tx0),
          ty=smooth(ty0);
      ix0&=mask;
      iy0&=mask;

      var ix1=ix0+1,
          iy1=iy0+1;
      
      var h0=hash[ix0],
          h1=hash[ix1];
      var g00=gradients2D[hash[parseInt(h0+iy0)]&gradientsMask2D],
          g01=gradients2D[hash[parseInt(h0+iy1)]&gradientsMask2D],
          g10=gradients2D[hash[parseInt(h1+iy0)]&gradientsMask2D],
          g11=gradients2D[hash[parseInt(h1+iy1)]&gradientsMask2D];

      var v00=dot(g00,new THREE.Vector2(tx0,ty0)),
          v01=dot(g01,new THREE.Vector2(tx0,ty1)),
          v10=dot(g10,new THREE.Vector2(tx1,ty0)),
          v11=dot(g11,new THREE.Vector2(tx1,ty1));
      var st1=lerp(v00,v10,tx,1),
          st2=lerp(v01,v11,tx,1);
      
      return lerp(st1,st2,ty,1)*Math.sqrt(2);

   };

  var perlin3D=function(input,frequency){
      var root=this;
      var gradients2D=[new THREE.Vector2(1,0),
                       new THREE.Vector2(-1,0),
                       new THREE.Vector2(0,1),
                       new THREE.Vector2(0,-1),
                       new THREE.Vector2( 1, 1).normalize(),
                       new THREE.Vector2(-1, 1).normalize(),
                       new THREE.Vector2( 1,-1).normalize(),
                       new THREE.Vector2(-1,-1).normalize()
                       ],
          gradientsMask2D=7;
      var mask=root.hashSetting.mask,
          hash=root.hash;

      var v=input.clone().multiplyScalar(frequency);
      var ix0=Math.floor(v.x),
          iy0=Math.floor(v.y),
          iz0=Math.floor(v.z);
      var tx0=v.x-ix0,
          tx1=tx0-1,
          ty0=v.y-iy0,
          ty1=ty0-1,
          tz0=v.z-iz0,
          tz1=tz0-1;
          tx=smooth(tx0),
          ty=smooth(ty0),
          tz=smooth(tz0);
      ix0&=mask;
      iy0&=mask;
      iz0&=mask;

      var ix1=ix0+1,
          iy1=iy0+1,
          iz1=iz0+1;
      
      var h0=hash[ix0],
          h1=hash[ix1],
          h00=hash[parseInt(h0+iy0)],
          h01=hash[parseInt(h0+iy1)],
          h10=hash[parseInt(h1+iy0)],
          h11=hash[parseInt(h1+iy1)];
      var g000=gradients2D[hash[parseInt(h00+iz0)]&gradientsMask2D],
          g010=gradients2D[hash[parseInt(h01+iz0)]&gradientsMask2D],
          g001=gradients2D[hash[parseInt(h00+iz1)]&gradientsMask2D],
          g100=gradients2D[hash[parseInt(h10+iz0)]&gradientsMask2D],
          g011=gradients2D[hash[parseInt(h01+iz1)]&gradientsMask2D],
          g101=gradients2D[hash[parseInt(h10+iz1)]&gradientsMask2D],
          g110=gradients2D[hash[parseInt(h11+iz0)]&gradientsMask2D],
          g111=gradients2D[hash[parseInt(h11+iz1)]&gradientsMask2D];

      var v000=dot(g000,new THREE.Vector3(tx0,ty0,tz0)),
          v010=dot(g010,new THREE.Vector3(tx0,ty1,tz0)),
          v001=dot(g001,new THREE.Vector3(tx0,ty0,tz1)),
          v100=dot(g100,new THREE.Vector3(tx1,ty0,tz0)),
          v011=dot(g011,new THREE.Vector3(tx0,ty1,tz1)),
          v101=dot(g101,new THREE.Vector3(tx1,ty0,tz1)),
          v110=dot(g110,new THREE.Vector3(tx1,ty1,tz0)),
          v111=dot(g110,new THREE.Vector3(tx1,ty1,tz1));
         
      var st1=lerp(v000,v100,tx,1),
          st2=lerp(v010,v110,tx,1),
          st3=lerp(v001,v101,tx,1),
          st4=lerp(v011,v111,tx,1);
      
      return lerp(lerp(st1,st2,ty,1),lerp(st3,st4,ty,1),tz,1);
   };

   function getPerlinMethod(dim){
      var func;
      if(dim==1)  func=perlin1D;
      if(dim==2)  func=perlin2D;
      if(dim==3)  func=perlin3D;
      return func;
   }

   //fracal noise
   function fracalValue_basic(input,dim){
      var root=this;
      var method=getValueMethod(dim);
      var base=method.call(root,input,root.frequency),
          base2=method.call(root,input.clone().multiplyScalar(2),root.frequency*2);
      return base+base2*0.5;
   }


   function fracalPerlin_basic(input,dim){
      var root=this;
      var method=getPerlinMethod(dim);
      var base=method.call(root,input,root.frequency),
          base2=method.call(root,input.clone().multiplyScalar(2),root.frequency*2);     

      return (base+base2*0.5)/1.5;
   }

    function fracal(input,dim,type){
      var root=this;
      var method;
      if(type=="value") method=getPerlinMethod(dim);
      if(type=="perlin") method=getPerlinMethod(dim);
      var base=method.call(root,input,root.frequency);

      var amplitude=1,
          range=1,
          frequency=root.frequency;
      for(var i=0; i<root.octaves; i++){
        frequency*=root.lacunarity;
        amplitude*=root.persistence;
        range+=amplitude;
        var base2=method.call(root,input,frequency);
        base+=base2*amplitude;
      }
      
      return base/range;
   }


   function createRandomHash(){
       var root=this;
       var range=root.hashSetting.range,
           num=root.hashSetting.num;
       var length=range.to-range.from;
       var outcome1=[],
           outcome2=[];
       var pool={};
       for(var i=0; i<num; i++){
       	  var o=range.from+Math.random()*length;
          if(!pool[o]){
            outcome1.push(o);
            outcome2.push(o);
            pool.o=0;
          }
       }
      root.hash=outcome1.concat(outcome2);
      root.hashSetting.mask=range.to;
   }

   //interpolate
   function lerp(a,b,t,dim){
      if(dim==1){
        return (b-a)*t+a;
      }else if(dim==2){
        var v=new THREE.Vector2();
        return b.clone().sub(a).multiplyScalar(t).add(a);
      }else if(dim==3){
        var v=new THREE.Vector3();
        return v.subVectors(b,a).multiplyScalar(t).add(a); 
      }else{
        console.log("out of dimensions");
        return false;
      }
   }


   function smooth (t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
   }

   function dot(vec1,vec2){
      return vec1.clone().dot(vec2);
   }

})();